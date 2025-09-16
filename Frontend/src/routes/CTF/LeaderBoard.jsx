import React, { useState, useMemo } from "react";
import { Terminal, RefreshCw } from "lucide-react";
import { useSocket } from "../../context/useSocket";
import Radarcomponent from "../../components/Leaderboard/Radar";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom"; // <-- added

export default function Leaderboard() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const {
    leaderboardData = [],
    clientCount,
    isConnected,
    reconnect,
  } = useSocket();
  const { user } = useAppContext();

  const navigate = useNavigate(); // <-- added

  // helper to navigate to /info with the expected state
  const goToInfo = (id, isTeam) => {
    navigate("/public/info", { state: { viewId: { id, isTeam } } });
  };

  // Resolve a stable identifier for the current user/team:
  // prefer teamId, otherwise fall back to user.id or user.userId
  const userTeamId = useMemo(() => {
    if (!user) return null;
    if (user.userRole && user.userRole !== "User") return null; // only highlight normal users
    return user.teamId ?? user.id ?? user.userId ?? null;
  }, [user]);

  // also keep explicit userId/name for cases where user has no team or isn't on the board
  const userId = useMemo(() => {
    if (!user) return null;
    return user.id ?? user.userId ?? null;
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (!user) return "You";
    return user.name ?? user.username ?? user.displayName ?? "You";
  }, [user]);

  // Transform + Dedupe data to match expected format (defensive)
  const rows = useMemo(() => {
    const map = new Map(); // id -> row (keep highest score if duplicate id)
    for (const item of leaderboardData || []) {
      const normalizedId = item.teamId ?? item.id ?? item.teamId;
      const isTeamBool =
        typeof item.isTeam === "string"
          ? item.isTeam.toLowerCase() === "team"
          : !!item.isTeam;
      const row = {
        id: normalizedId,
        team: item.teamName ?? item.team ?? `Team ${normalizedId ?? "?"}`,
        score:
          typeof item.score === "number" ? item.score : Number(item.score) || 0,
        rank:
          typeof item.rank === "number" ? item.rank : Number(item.rank) || 0,
        isTeam: isTeamBool,
        isTeamRaw:
          typeof item.isTeam === "string"
            ? item.isTeam.toLowerCase()
            : item.isTeam,
        updatedAt: item.updatedAt,
        raw: item,
      };

      if (!normalizedId) {
        // if no id, push a synthetic unique id
        const synthetic = `noid-${Math.random().toString(36).slice(2, 9)}`;
        row.id = synthetic;
        map.set(row.id, row);
        continue;
      }

      const existing = map.get(String(normalizedId));
      if (!existing) {
        map.set(String(normalizedId), row);
      } else {
        // keep row with higher score (or newer updatedAt if equal)
        if ((row.score || 0) > (existing.score || 0)) {
          map.set(String(normalizedId), row);
        } else if ((row.score || 0) === (existing.score || 0)) {
          // fallback to newer updatedAt if both have same score
          if (
            row.updatedAt &&
            (!existing.updatedAt ||
              new Date(row.updatedAt) > new Date(existing.updatedAt))
          ) {
            map.set(String(normalizedId), row);
          }
        }
      }
    }

    return Array.from(map.values());
  }, [leaderboardData]);

  // Find the user's team row (if present). If not found, create a pseudo row so we can still pin the user.
  const pinned = useMemo(() => {
    if (!user) return null;

    // 1) by teamId/userTeamId
    if (userTeamId) {
      const found = rows.find((r) => String(r.id) === String(userTeamId));
      if (found) return found;
    }

    // 2) by userId
    if (userId) {
      const foundByUser = rows.find((r) => String(r.id) === String(userId));
      if (foundByUser) return foundByUser;
    }

    // 3) try match by display name (case-insensitive) — helpful for solo entries where teamName === username
    const lowerName = String(userDisplayName || "")
      .trim()
      .toLowerCase();
    if (lowerName) {
      const matchByName = rows.find(
        (r) =>
          String(r.team || "")
            .trim()
            .toLowerCase() === lowerName
      );
      if (matchByName) return matchByName;
    }

    // 4) not found — create pseudo pinned row so user's status shows at top
    const isOnTeam = !!(user.teamId && String(user.teamId).trim() !== "");
    return {
      id: userId ?? `you-${Date.now()}`,
      team: isOnTeam ? `${userDisplayName} (team)` : userDisplayName,
      score: 0,
      rank: "—",
      isTeam: !!isOnTeam,
      isPseudo: true,
      updatedAt: null,
      raw: null,
    };
  }, [rows, user, userTeamId, userId, userDisplayName]);

  // Filter + sort for listing (we'll exclude pinned from the main list so it doesn't duplicate)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // build a set of IDs to exclude from the main list so pinned never duplicates
    const excludeIds = new Set();
    if (pinned && pinned.id) excludeIds.add(String(pinned.id));
    if (userTeamId) excludeIds.add(String(userTeamId));
    if (userId) excludeIds.add(String(userId));

    // Additionally, if pinned is pseudo but some real row has same team name, exclude that real row (so pseudo isn't visually duplicated)
    const excludeByName =
      pinned && pinned.isPseudo
        ? String(pinned.team || "")
            .trim()
            .toLowerCase()
        : null;

    let list = rows.filter((r) => {
      if (excludeIds.has(String(r.id))) return false;
      if (
        excludeByName &&
        String(r.team || "")
          .trim()
          .toLowerCase() === excludeByName
      )
        return false;

      if (!q) return true;
      const teamMatch = String(r.team || "")
        .toLowerCase()
        .includes(q);
      const idMatch = String(r.id || "")
        .toLowerCase()
        .includes(q);
      return teamMatch || idMatch;
    });

    // Sorting:
    // - score: numeric desc
    // - rank: numeric asc (treat non-numeric ranks as Infinity, so they go to bottom)
    // - name: alphabetical
    if (sortBy === "score") {
      list = list.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === "rank") {
      list = list.slice().sort((a, b) => {
        const ra = typeof a.rank === "number" ? a.rank : Infinity;
        const rb = typeof b.rank === "number" ? b.rank : Infinity;
        return ra - rb;
      });
    } else if (sortBy === "name") {
      list = list.slice().sort((a, b) => a.team.localeCompare(b.team));
    }

    return list;
  }, [rows, query, sortBy, pinned, userTeamId, userId]);

  // helper to render the glass-highlighted pinned team
  function PinnedCard({ row }) {
    if (!row) {
      return (
        <div
          className="
            mb-4 p-3 rounded-xl
            bg-gradient-to-b from-[rgba(1,255,219,0.06)] to-[rgba(1,255,219,0.02)]
            border border-[rgba(1,255,219,0.18)]
            shadow-[0_8px_30px_rgba(1,255,219,0.06)]
          "
        >
          <div className="text-sm text-[rgba(255,255,255,0.55)]">
            Your team is not on the leaderboard yet.
          </div>
        </div>
      );
    }

    const isSolo = !row.isTeam;
    const badgeText = isSolo ? "You" : "Your team";
    // nice label for team type
    const typeLabel = row.isTeam ? "Team" : "Solo Warrior";

    return (
      <div
        className="
          mb-4 p-4 rounded-2xl
          bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]
          border
          shadow-[0_10px_40px_rgba(1,255,219,0.08),inset_0_1px_0_rgba(255,255,255,0.02)]
        "
        style={{ borderColor: "rgba(1,255,219,0.28)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(1,255,219,0.12), rgba(1,255,219,0.04))",
                color: "#01ffdb",
                border: "1px solid rgba(1,255,219,0.18)",
                boxShadow: "0 6px 18px rgba(1,255,219,0.06)",
              }}
            >
              #{row.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {/* group wrapper for hover tooltip */}
                <div className="relative inline-block group">
                  <div
                    className="text-lg font-semibold truncate cursor-pointer"
                    style={{ color: "#01ffdb" }}
                    onClick={() => goToInfo(row.id, row.isTeam)} // <-- clickable pinned team
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goToInfo(row.id, row.isTeam);
                    }}
                  >
                    {row.team}
                  </div>

                  {/* minimalist tooltip */}
                  <div className="pointer-events-none absolute left-0 top-full mt-2 w-max opacity-0 scale-95 transform transition-all duration-150 origin-top-left group-hover:opacity-100 group-hover:scale-100">
                    <div className="whitespace-nowrap rounded px-2 py-1 text-xs bg-black/80 text-white shadow">
                      Open progress
                    </div>
                  </div>
                </div>

                <div
                  className="px-2 py-0.5 text-xs rounded-md flex items-center gap-2"
                  style={{
                    background: "rgba(1,255,219,0.08)",
                    color: "#01ffdb",
                  }}
                >
                  <span>{badgeText}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded bg-[rgba(1,255,219,0.04)]"
                    style={{ color: "#01ffdb" }}
                  >
                    {typeLabel}
                  </span>
                </div>
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.55)]">
                {row.isTeam ? "team id: " : "user id: "}
                {row.id}
                {row.isPseudo ? " • Not on leaderboard" : ""}
              </div>
            </div>
          </div>

          <div className="text-right min-w-[6rem]">
            <div className="text-xl font-bold" style={{ color: "#01ffdb" }}>
              {row.score}
            </div>
            {/* <div className="text-xs text-[rgba(255,255,255,0.55)]">
              Rank: {row.rank}
            </div> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Left: Live Feed Panel */}
        <div className="col-span-1 flex items-center justify-center">
          <div
            className="
              w-full max-w-[600px] h-[600px] 
              bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)] 
              backdrop-blur-[8px] border border-[rgba(1,255,219,0.12)] 
              shadow-[0_8px_30px_rgba(1,255,219,0.04)] 
              rounded-2xl p-6 
              flex flex-col items-center justify-center
              md:fixed md:top-1/2 md:left-1/4 md:-translate-x-1/2 md:-translate-y-1/2 md:z-10
              md:mt-15
              overflow-y-auto
            "
          >
            <div className="text-xl font-semibold text-[#01ffdb]">
              CTF Live Feed
            </div>
            <Radarcomponent clientCount={clientCount} />
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div className="col-span-1 flex items-stretch">
          <div className="w-full bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)] backdrop-blur-[8px] border border-[rgba(1,255,219,0.12)] shadow-[0_8px_30px_rgba(1,255,219,0.04)] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 md:gap-0">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-2xl font-semibold text-[#01ffdb]">
                    CTF Leaderboard
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-stretch md:items-center w-full md:w-auto">
                <input
                  placeholder="Search team or id"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="px-3 py-2 bg-transparent border rounded-lg outline-none border-[rgba(255,255,255,0.06)] text-white flex-1"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2 bg-black/80 border rounded-lg outline-none border-[rgba(255,255,255,0.06)] text-white flex-1"
                >
                  <option value="score">Sort: Score</option>
                  {/* <option value="rank">Sort: Rank</option> */}
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>

            {/* Pinned user's team shown at top */}
            <div>
              <PinnedCard row={pinned} />
            </div>

            {/* Leaderboard List */}
            <div className="overflow-hidden rounded-xl">
              <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs text-[rgba(255,255,255,0.55)] border-b border-[rgba(255,255,255,0.04)]">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Team</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-2 text-right">Rank</div>
              </div>

              <div className="space-y-2 p-3">
                {filtered.length === 0 ? (
                  <div className="text-center text-[rgba(255,255,255,0.55)] py-4">
                    No teams found or loading...
                  </div>
                ) : (
                  filtered.map((r, idx) => {
                    const isPinnedRow =
                      pinned &&
                      !pinned.isPseudo &&
                      String(r.id) === String(pinned.id);

                    const typeLabel = r.isTeam ? "Team" : "Solo Warrior";
                    const rankVal =
                      typeof r.rank === "number" ? r.rank : r.rank; // display original (number or '—')
                    const isTop3 = typeof r.rank === "number" && r.rank <= 3;

                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-4 px-3 py-3 rounded-lg ${
                          isTop3
                            ? "shadow-[0_6px_28px_rgba(1,255,219,0.08),inset_0_1px_0_rgba(255,255,255,0.02)]"
                            : ""
                        }`}
                        style={{
                          background:
                            idx % 2 === 0
                              ? "linear-gradient(180deg, rgba(255,255,255,0.01), transparent)"
                              : "transparent",
                          border: isPinnedRow
                            ? "2px solid rgba(1,255,219,0.18)"
                            : undefined,
                        }}
                      >
                        <div
                          className="min-w-[2rem] text-lg font-medium"
                          style={{ color: r.rank === 1 ? "#01ffdb" : "white" }}
                        >
                          {rankVal}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {/* group wrapper for hover tooltip on list */}
                            <div className="relative group">
                              <div
                                className="font-medium truncate cursor-pointer"
                                onClick={() => goToInfo(r.id, r.isTeam)} // <-- clickable team name
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    goToInfo(r.id, r.isTeam);
                                }}
                              >
                                {r.team}
                              </div>

                              {/* minimalist tooltip */}
                              <div className="pointer-events-none absolute left-0 top-full mt-2 w-max opacity-0 scale-95 transform transition-all duration-150 origin-top-left group-hover:opacity-100 group-hover:scale-100">
                                <div className="whitespace-nowrap rounded px-2 py-1 text-xs bg-black/80 text-white shadow">
                                  Open progress
                                </div>
                              </div>
                            </div>

                            <div className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.6)]">
                              {typeLabel}
                            </div>
                          </div>
                          <div className="text-xs text-[rgba(255,255,255,0.55)]">
                            {r.isTeam ? "team id: " : "user id: "}
                            {r.id}
                          </div>
                        </div>
                        <div className="min-w-[6rem] text-right font-semibold">
                          {r.score}
                        </div>
                        <div className="min-w-[4rem] text-right text-[rgba(255,255,255,0.55)]">
                          {r.rank}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-[rgba(255,255,255,0.55)] text-right">
              Live updates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
