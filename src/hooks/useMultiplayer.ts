import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AI_PLAYERS } from "@/lib/aiPlayers";

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  wins: number;
  total: number;
  streak: number;
  teamPicked?: string | null;
}

export interface GameSnapshotBall {
  id: number;
  label: string;
  state: "idle" | "pending" | "resolved";
  openedAt: number;
  result: { label: string; type: string } | null;
}

export interface GameSnapshotMatch {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  currentBowler: string;
  target: number | null;
}

export interface GameSnapshot {
  phase: "lobby" | "pregame" | "game";
  ball: GameSnapshotBall | null;
  match: GameSnapshotMatch;
}

export interface RoomPrediction {
  player_name: string;
  ball_id: number;
  prediction: string;
}

export function useMultiplayer() {
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [gameSnapshot, setGameSnapshot] = useState<GameSnapshot | null>(null);
  const [currentPredictions, setCurrentPredictions] = useState<RoomPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelsRef = useRef<any[]>([]);

  const cleanup = useCallback(() => {
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];
  }, []);

  const fetchPlayers = useCallback(async (rId: string) => {
    const { data } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", rId)
      .order("joined_at", { ascending: true });
    if (data) {
      setPlayers(data.map(p => ({
        id: p.id,
        name: p.player_name,
        avatar: p.avatar,
        isHost: p.is_host,
        wins: p.wins,
        total: p.total_predictions,
        streak: p.streak,
        teamPicked: p.team_picked,
      })));
    }
  }, []);

  const subscribe = useCallback((rId: string) => {
    cleanup();

    // Room snapshot changes
    const roomCh = supabase
      .channel(`room:${rId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${rId}`,
      }, (payload) => {
        const snap = (payload.new as any).game_snapshot;
        if (snap) setGameSnapshot(snap as GameSnapshot);
      })
      .subscribe();

    // Player changes
    const playerCh = supabase
      .channel(`players:${rId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${rId}`,
      }, () => { fetchPlayers(rId); })
      .subscribe();

    // Prediction changes (for current ball picks)
    const predCh = supabase
      .channel(`predictions:${rId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "room_predictions", filter: `room_id=eq.${rId}`,
      }, (payload) => {
        const pred = payload.new as any;
        setCurrentPredictions(prev => {
          const existing = prev.find(p => p.player_name === pred.player_name && p.ball_id === pred.ball_id);
          if (existing) return prev;
          return [...prev, { player_name: pred.player_name, ball_id: pred.ball_id, prediction: pred.prediction }];
        });
      })
      .subscribe();

    channelsRef.current = [roomCh, playerCh, predCh];
  }, [cleanup, fetchPlayers]);

  const createRoom = useCallback(async (name: string, avatar: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const initialSnapshot: GameSnapshot = {
        phase: "lobby",
        ball: null,
        match: { runs: 0, wickets: 0, overs: 0, balls: 0, currentBowler: "Bumrah", target: 185 },
      };

      const { error: roomErr } = await supabase.from("rooms").insert({
        id: code,
        host_name: name,
        status: "waiting",
        game_snapshot: initialSnapshot as any,
      });
      if (roomErr) throw roomErr;

      const { data: playerData, error: playerErr } = await supabase
        .from("room_players")
        .insert({ room_id: code, player_name: name, avatar, is_host: true })
        .select()
        .single();
      if (playerErr) throw playerErr;

      setMyId(playerData.id);
      setMyName(name);
      setRoomId(code);
      setIsHost(true);
      setGameSnapshot(initialSnapshot);

      // Insert AI bot players into the room
      const aiInserts = AI_PLAYERS.map(ai => ({
        room_id: code,
        player_name: ai.name,
        avatar: ai.avatar,
        is_host: false,
        team_picked: ai.team,
      }));
      await supabase.from("room_players").insert(aiInserts);

      await fetchPlayers(code);
      subscribe(code);
      return code;
    } catch (e: any) {
      setError(e.message || "Failed to create room");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [subscribe]);

  const joinRoom = useCallback(async (code: string, name: string, avatar: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const roomCode = code.toUpperCase().trim();
      const { data: room, error: roomErr } = await supabase
        .from("rooms").select("*").eq("id", roomCode).single();
      if (roomErr || !room) {
        setError("Room not found. Check the code!");
        return false;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("room_players")
        .insert({ room_id: roomCode, player_name: name, avatar, is_host: false })
        .select()
        .single();
      if (playerErr) {
        if (playerErr.message?.includes("duplicate")) {
          setError("Name already taken in this room!");
        } else {
          setError(playerErr.message);
        }
        return false;
      }

      setMyId(playerData.id);
      setMyName(name);
      setRoomId(roomCode);
      setIsHost(false);
      if (room.game_snapshot) {
        setGameSnapshot(room.game_snapshot as unknown as GameSnapshot);
      }
      await fetchPlayers(roomCode);
      subscribe(roomCode);
      return true;
    } catch (e: any) {
      setError(e.message || "Failed to join room");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscribe, fetchPlayers]);

  const updateGameSnapshot = useCallback(async (snapshot: GameSnapshot) => {
    if (!roomId) return;
    setGameSnapshot(snapshot);
    await supabase.from("rooms").update({ game_snapshot: snapshot as any }).eq("id", roomId);
  }, [roomId]);

  const submitPick = useCallback(async (ballId: number, pick: string, playerName: string) => {
    if (!roomId) return;
    await supabase.from("room_predictions").upsert({
      room_id: roomId,
      player_name: playerName,
      ball_id: ballId,
      prediction: pick,
    }, { onConflict: "room_id,player_name,ball_id" });
  }, [roomId]);

  const updateMyScore = useCallback(async (wins: number, total: number, streak: number) => {
    if (!myId) return;
    await supabase.from("room_players").update({
      wins, total_predictions: total, streak,
    }).eq("id", myId);
  }, [myId]);

  const updateMyTeam = useCallback(async (team: string) => {
    if (!myId) return;
    await supabase.from("room_players").update({ team_picked: team }).eq("id", myId);
  }, [myId]);

  const startGame = useCallback(async () => {
    if (!roomId || !isHost) return;
    await supabase.from("rooms").update({ status: "active" }).eq("id", roomId);
    const snap: GameSnapshot = {
      phase: "game",
      ball: null,
      match: gameSnapshot?.match || { runs: 0, wickets: 0, overs: 0, balls: 0, currentBowler: "Bumrah", target: 185 },
    };
    await updateGameSnapshot(snap);
  }, [roomId, isHost, gameSnapshot, updateGameSnapshot]);

  const fetchPredictionsForBall = useCallback(async (ballId: number) => {
    if (!roomId) return [];
    const { data } = await supabase
      .from("room_predictions")
      .select("player_name, ball_id, prediction")
      .eq("room_id", roomId)
      .eq("ball_id", ballId);
    if (data) {
      setCurrentPredictions(data);
      return data;
    }
    return [];
  }, [roomId]);

  const removeAIPlayers = useCallback(async () => {
    if (!roomId || !isHost) return;
    const aiNames = AI_PLAYERS.map(a => a.name);
    await supabase.from("room_players").delete().eq("room_id", roomId).in("player_name", aiNames);
    await fetchPlayers(roomId);
  }, [roomId, isHost]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    myId, myName, roomId, isHost, players, gameSnapshot,
    currentPredictions, isLoading, error,
    createRoom, joinRoom, updateGameSnapshot, submitPick,
    updateMyScore, updateMyTeam, startGame, fetchPredictionsForBall,
    setError, removeAIPlayers,
  };
}
