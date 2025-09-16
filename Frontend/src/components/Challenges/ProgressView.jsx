import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Dashboard from "../Profile/Dashboard";
import Usefetch from "../../hooks/Usefetch"; // your hook — unchanged
import { RefreshCw } from "lucide-react";

const ProgressView = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // state passed via navigate("/info", { state: { viewId } })
  const viewId = state?.viewId;

  // If viewId is missing, navigate back to leaderboard (do it in an effect to avoid render-time side effects)
  useEffect(() => {
    if (!viewId) {
      navigate("/leaderboard", { replace: true });
    }
  }, [viewId, navigate]);

  // Derive endpoint directly (no internal state) — stable string or null
  const teamEndpoint = useMemo(() => {
    if (!viewId || !viewId.isTeam) return null;
    const id = viewId.id ?? viewId._id ?? viewId;
    return `team/description/${id}`; // matches your backend route
  }, [viewId]);

  // Usefetch with auto=false: we will control when to call retry()
  const {
    Data: teamData,
    loading: teamLoading,
    error: teamError,
    retry: teamRetry,
  } = Usefetch(teamEndpoint, "get", null, {}, false);

  // Keep track of endpoints we've already requested to ensure retry() is invoked only once per endpoint
  const fetchedEndpointsRef = useRef(new Set());

  // When a new teamEndpoint appears, call teamRetry exactly once (per endpoint).
  useEffect(() => {
    if (!teamEndpoint) return;

    // If we've already attempted to fetch this endpoint, skip
    if (fetchedEndpointsRef.current.has(teamEndpoint)) {
      return;
    }

    // Mark as fetched immediately to avoid duplicate calls during quick re-renders
    fetchedEndpointsRef.current.add(teamEndpoint);

    // Call retry() once; it may internally schedule retries on network errors per your hook logic,
    // but our code won't call retry() repeatedly.
    try {
      teamRetry();
    } catch (err) {
      // teamRetry may be async function — swallow sync errors just in case
      // (the hook manages errors in its state)
      // Optional: console.error("teamRetry error", err);
    }

    // No cleanup needed — we intentionally remember that we fetched this endpoint.
  }, [teamEndpoint, teamRetry]);

  // Render nothing while redirecting
  if (!viewId) return null;

  return (
    <section className="max-w-6xl mx-auto p-6">
      {/* Header / Team card */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              {viewId.isTeam ? "Team" : "User"} Progress
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              View detailed progress and statistics for the selected{" "}
              {viewId.isTeam ? "team" : "user"}.
            </p>
          </div>

          {/* Small helper / back button */}
          <div>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1 rounded-md border border-slate-700 text-sm hover:bg-white/2 transition"
            >
              Back
            </button>
          </div>
        </div>

        {/* Team info box (only for teams) */}
        {viewId.isTeam && (
          <div className="mt-6">
            {teamLoading && (
              <div className="p-4 rounded-lg bg-white/3 border border-white/6">
                <div className="loader mb-2" />
                <div className="text-sm text-slate-400">Loading team info…</div>
              </div>
            )}

            {teamError && (
              <div className="p-4 rounded-lg bg-red-800/20 border border-red-700/30">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-red-300">
                      Failed to load team info
                    </div>
                    <div className="text-sm text-red-200 mt-1">
                      {teamError?.message ||
                        "An error occurred while fetching team details."}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {/* Manual refresh: call teamRetry and also allow re-attempt by clearing the fetched flag */}
                    <button
                      onClick={() => {
                        // allow retry again for this endpoint
                        fetchedEndpointsRef.current.delete(teamEndpoint);
                        teamRetry();
                      }}
                      className="px-3 py-1 rounded bg-red-600/30 hover:bg-red-600/40 transition text-sm"
                      title="Retry"
                    >
                      <RefreshCw className="inline-block w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show team card when data is present */}
            {teamData && (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-b from-white/3 to-white/2 border border-white/6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 rounded-full w-14 h-14 flex items-center justify-center text-xl font-bold"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(0,255,230,0.08), rgba(0,255,230,0.02))",
                      color: "#00ffd6",
                      border: "1px solid rgba(0,255,230,0.08)",
                    }}
                  >
                    {String(teamData?.data?.teamName || "Team")
                      .trim()
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">
                        {teamData?.data?.teamName ||
                          teamData?.name ||
                          "Unnamed team"}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/3 text-slate-300">
                        Team
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 truncate">
                      {teamData?.data?.description ??
                        "No description provided."}
                    </p>

                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">Team ID:</span>{" "}
                      <span className="text-slate-400">
                        {teamData?.data?._id}
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto text-sm text-slate-400">
                    {/* small action area (retry if needed) */}
                    {!teamLoading && (
                      <button
                        onClick={() => {
                          // allow retry again and call it
                          fetchedEndpointsRef.current.delete(teamEndpoint);
                          teamRetry();
                        }}
                        className="px-3 py-1 rounded-md border border-slate-700 hover:bg-white/2 transition text-sm"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* If no teamData and not loading, show fallback */}
            {!teamLoading && !teamError && !teamData && (
              <div className="mt-4 p-4 rounded-lg bg-white/3 border border-white/6 text-sm text-slate-400">
                Team details are not available.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashboard content */}
      <Dashboard isTeam={viewId.isTeam} self={false} viewId={viewId} />
    </section>
  );
};

export default ProgressView;
