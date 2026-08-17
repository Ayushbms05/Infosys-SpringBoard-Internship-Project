/**
 * leagues-config.js — Tier Definitions & Rewards for Weekly Competitive Leagues
 *
 * Fully isolated configuration file.
 * All new learners start in the Bronze League and progress through weekly tiers.
 */

const LEAGUE_TIERS = [
  {
    id: "bronze",
    name: "Bronze League",
    icon: "🥉",
    tierNumber: 1,
    color: "#cd7f32",
    accentColor: "#d97706",
    bgGradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)",
    cardBg: "#fef3c7",
    borderColor: "#f59e0b",
    desc: "Beginning of your competitive learning journey",
    promotionText: "Top 5 promote to Silver League",
    rewards: { first: 100, second: 75, third: 50, promo: 30 }
  },
  {
    id: "silver",
    name: "Silver League",
    icon: "🥈",
    tierNumber: 2,
    color: "#94a3b8",
    accentColor: "#64748b",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)",
    cardBg: "#f1f5f9",
    borderColor: "#94a3b8",
    desc: "Steady practice and rising performance",
    promotionText: "Top 5 promote to Gold League",
    rewards: { first: 150, second: 100, third: 75, promo: 45 }
  },
  {
    id: "gold",
    name: "Gold League",
    icon: "🥇",
    tierNumber: 3,
    color: "#f59e0b",
    accentColor: "#d97706",
    bgGradient: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)",
    cardBg: "#fffbeb",
    borderColor: "#f59e0b",
    desc: "High dedication and consistent daily learning",
    promotionText: "Top 5 promote to Diamond League",
    rewards: { first: 200, second: 150, third: 100, promo: 60 }
  },
  {
    id: "diamond",
    name: "Diamond League",
    icon: "💎",
    tierNumber: 4,
    color: "#00d4aa",
    accentColor: "#06b6d4",
    bgGradient: "linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0d9488 100%)",
    cardBg: "#ecfdf5",
    borderColor: "#10b981",
    desc: "The pinnacle of literacy achievement and elite mastery",
    promotionText: "Elite Champions Arena",
    rewards: { first: 300, second: 225, third: 150, promo: 100 }
  }
];
