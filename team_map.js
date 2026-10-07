// =====================================================================
// SSO Sales Dashboard — PIC → Team / Leader mapping
//
// Each SKU gets its Team and Leader from (first match wins):
//   1. columns `team` / `leader` on the skus table (if they exist),
//   2. this map, looked up by the SKU's PIC,
//   3. 'Chưa gán team' / 'Chưa gán leader'.
//
// Fill this in from the team list, one line per PIC, e.g.
//   'Nguyen Van A': { team: 'Team Cẩm Tú', leader: 'Cẩm Tú' },
// The PIC name must match the PIC column in the target file exactly
// (matching ignores upper/lower case and extra spaces).
// =====================================================================
window.TEAM_MAP = {
};
