/**
 * leagues-config.js — Tier Definitions for Weekly Leagues
 *
 * Fully isolated configuration file.
 * All new learners start in the Bronze League and progress through tiers.
 */

const LEAGUE_TIERS = [
  {
    id: "bronze",
    name: "Bronze League",
    icon: "🥉",
    color: "#cd7f32",
    bgGradient: "linear-gradient(135deg, #f7efe6, #edd5be)",
    borderColor: "#cd7f32",
    desc: "Beginning of your competitive learning journey"
  },
  {
    id: "silver",
    name: "Silver League",
    icon: "🥈",
    color: "#718096",
    bgGradient: "linear-gradient(135deg, #f0f4f8, #d9e2ec)",
    borderColor: "#a0aec0",
    desc: "Steady practice and rising performance"
  },
  {
    id: "gold",
    name: "Gold League",
    icon: "🥇",
    color: "#d69e2e",
    bgGradient: "linear-gradient(135deg, #fefcbf, #f6e05e)",
    borderColor: "#d69e2e",
    desc: "High dedication and consistent daily learning"
  },
  {
    id: "diamond",
    name: "Diamond League",
    icon: "💎",
    color: "#3182ce",
    bgGradient: "linear-gradient(135deg, #ebf8ff, #bee3f8)",
    borderColor: "#3182ce",
    desc: "The pinnacle of literacy achievement and practice"
  }
];
