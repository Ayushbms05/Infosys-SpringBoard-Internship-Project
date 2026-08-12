/**
 * curriculum.js — Themed Unit Definitions
 *
 * Used ONLY by units.js and the new "Units" tab.
 * This file is NOT loaded by lesson.html and does NOT affect the
 * existing lesson system in any way.
 *
 * Structure: CURRICULUM[level] = Array of unit objects
 * Each unit: { id, title, icon }
 */

const CURRICULUM = {
  beginner: [
    { id: "unit_greetings_numbers", title: "Greetings & Numbers", icon: "👋" },
    { id: "unit_daily_life",        title: "Daily Life",           icon: "🏠" },
    { id: "unit_family",            title: "Family & Relations",   icon: "👨‍👩‍👧" },
    { id: "unit_shopping",          title: "Shopping & Market",    icon: "🛒" },
  ],
  intermediate: [
    { id: "unit_work",    title: "Work & Employment", icon: "💼" },
    { id: "unit_health",  title: "Health & Medicine", icon: "🏥" },
    { id: "unit_banking", title: "Banking & Forms",   icon: "🏦" },
    { id: "unit_transit", title: "Transit & Travel",  icon: "🚌" },
  ],
  advanced: [
    { id: "unit_government",       title: "Government & Legal",      icon: "🏛️" },
    { id: "unit_workplace_comm",   title: "Workplace Communication", icon: "📋" },
  ],
};
