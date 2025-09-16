import React, { useState, useEffect } from "react";
import { Users, Plus, UserPlus } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import Usefetch from "../../../hooks/Usefetch";

export default function TeamInitialState() {
  const { fetchTeam } = useAppContext();
  const [activeTab, setActiveTab] = useState("join");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    teamCode: "",
    inviteCode: "",
    teamName: "",
    teamDescription: "",
  });

  // Use Usefetch hook for accepting invite - don't auto-trigger
  const {
    Data: inviteData,
    error: inviteError,
    loading: inviteLoading,
    retry: acceptInvite,
  } = Usefetch("team/acceptInvite", "post", null, {}, false);

  // Use Usefetch hook for creating team - don't auto-trigger
  const {
    Data: createTeamData,
    error: createTeamError,
    loading: createTeamLoading,
    retry: createTeamAPI,
  } = Usefetch("team/createTeam", "post", null, {}, false);

  const inputStyle =
    "w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#00bfff]/15 via-[#1e90ff]/10 to-[#00bfff]/5 border border-[#00bfff]/30 transition-all duration-300 text-white placeholder-[#00bfff]/50 outline-none focus:outline-none focus:ring-1 focus:ring-[#00bfff] focus:border-[#00bfff]/50";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();

    if (!formData.teamCode.trim() || !formData.inviteCode.trim()) {
      setError("Please enter both team code and invite code");
      return;
    }

    setError("");

    // Call the acceptInvite function with both codes
    await acceptInvite(
      {},
      {
        data: {
          teamCode: formData.teamCode,
          inviteCode: formData.inviteCode,
        },
      }
    );
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!formData.teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setError("");

    // Call the createTeamAPI function with team data
    await createTeamAPI(
      {},
      {
        data: {
          teamName: formData.teamName,
          description: formData.teamDescription,
        },
      }
    );
  };

  // Handle invite response
  useEffect(() => {
    if (inviteData?.message === "Invite accepted successfully") {
      // Handle successful invite acceptance
      setTimeout(() => {
        fetchTeam();
      }, 800);
      // console.log("Successfully joined team:", inviteData.data);
      // You might want to redirect or update app state here
      // navigate('/team-dashboard') or similar
    }
  }, [inviteData]);

  // Handle invite errors
  useEffect(() => {
    if (inviteError) {
      setError("Invalid invite code. Please check and try again.");
    }
  }, [inviteError]);

  // Handle create team response
  useEffect(() => {
    if (createTeamData?.message === "Team created successfully") {
      // Handle successful team creation
      setTimeout(() => {
        fetchTeam();
      }, 800); // console.log("Successfully created team:", createTeamData.team);
      // You might want to redirect or update app state here
      // navigate('/team-dashboard') or similar
    }
  }, [createTeamData]);

  // Handle create team errors
  useEffect(() => {
    if (createTeamError) {
      setError("Failed to create team. Please try again.");
    }
  }, [createTeamError]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#00bfff]/20 to-[#1e90ff]/20 rounded-full mb-6">
            <Users className="w-10 h-10 text-[#00ffff]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to TeamUp
          </h1>
          <p className="text-[#00ffff]/60 text-lg">
            Join an existing team or create your own to get started
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-black/30 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("join")}
            className={` flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-300 ${
              activeTab === "join"
                ? "bg-[#00ffff]/10 text-[#00ffff] shadow-sm"
                : "text-[#00ffff]/60 hover:text-[#00ffff]/80"
            }`}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Join Team
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-300 ${
              activeTab === "create"
                ? "bg-[#00ffff]/10 text-[#00ffff] shadow-sm"
                : "text-[#00ffff]/60 hover:text-[#00ffff]/80"
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Team
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-8">
          {activeTab === "join" ? (
            <form onSubmit={handleJoinTeam} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#00ffff] mb-2">
                  Join Existing Team
                </h2>
                <p className="text-[#00ffff]/50 mb-6">
                  Enter the invite code provided by your team leader
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00ffff]/70 mb-2">
                      Team Code *
                    </label>
                    <input
                      type="text"
                      name="teamCode"
                      value={formData.teamCode}
                      onChange={handleInputChange}
                      placeholder="Enter team code"
                      className={inputStyle}
                      disabled={inviteLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#00ffff]/70 mb-2">
                      Invite Code *
                    </label>
                    <input
                      type="text"
                      name="inviteCode"
                      value={formData.inviteCode}
                      onChange={handleInputChange}
                      placeholder="Enter invite code"
                      className={inputStyle}
                      disabled={inviteLoading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {inviteData?.message === "Invite accepted successfully" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    Successfully joined team: {inviteData.data.teamName}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  inviteLoading ||
                  !formData.teamCode.trim() ||
                  !formData.inviteCode.trim()
                }
                className="cyber-button w-full py-3 px-6 rounded-lgbg-[#01ffdb]/10 border border-[#01ffdb]/50 text-[#01ffdb] rounded-lg hover:bg-[#01ffdb]/20 transition-all"
              >
                {inviteLoading ? "Joining..." : "Join Team"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#00ffff] mb-2">
                  Create New Team
                </h2>
                <p className="text-[#00ffff]/50 mb-6">
                  Set up your team and invite members to collaborate
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00ffff]/70 mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleInputChange}
                      placeholder="Enter team name"
                      className={inputStyle}
                      disabled={createTeamLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#00ffff]/70 mb-2">
                      Team Description *
                    </label>
                    <textarea
                      name="teamDescription"
                      value={formData.teamDescription}
                      onChange={handleInputChange}
                      placeholder="Describe your team's purpose and goals (max 200 words)"
                      rows={3}
                      maxLength={1000}
                      className={inputStyle}
                      disabled={createTeamLoading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {createTeamData?.message === "Team created successfully" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    Successfully created team: {createTeamData.team.teamName}
                  </p>
                  <p className="text-green-400 text-xs mt-1">
                    Team Code: {createTeamData.team.teamCode}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={createTeamLoading || !formData.teamName.trim()}
                className="cyber-button w-full py-3 px-6 rounded-lgbg-[#01ffdb]/10 border border-[#01ffdb]/50 text-[#01ffdb] rounded-lg hover:bg-[#01ffdb]/20 transition-all"
              >
                {createTeamLoading ? "Creating..." : "Create Team"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
