// Package migrations embeds the SQL migration files so the API binary can run
// them on boot without shipping the .sql files alongside the executable.
package migrations

import "embed"

// FS holds every *.up.sql migration, applied in filename order by internal/db.
//
//go:embed *.up.sql
var FS embed.FS
