export interface JobGrade {
  name: string;         // Display name, e.g., "Officer"
  level: number;        // Numeric level
  is_boss: boolean;     // Can this grade manage the_job?
  // We can add permissions here later
}

export interface Job {
  label: string;        // Display name, e.g., "Los Santos Police Department"
  defaultDuty: boolean; // Is the player on duty by default?
  grades: {
    [level: string]: JobGrade; // e.g., grades['0'], grades['1']
  };
  // We can add default outfits, vehicles, etc. here
}
