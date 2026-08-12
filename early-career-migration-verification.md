# Early Career Migration Verification

The Early Career schema and product seed are defined in `drizzle/0056_nebulous_the_fallen.sql`. The migration introduces the `early_career_profiles`, `early_career_commitments`, `early_career_evidence`, and `early_career_manager_nudges` tables, the unique profile index, and the `early_career_intelligence` product/module seed.

## Verification completed in this environment

`scripts/verify-early-career-migration.mjs` runs the migration through Drizzle's standard MySQL migrator with a dedicated temporary migration ledger and a temporary table/product namespace. The verification confirms that the migrated schema creates all four tables, retains the unique employee-profile index, inserts the product/module seed, and records the migration hash in Drizzle's migration ledger. The temporary verification tables, seed, and ledger are removed after the check.

## Platform limitation

The supplied database user cannot create a separate database/schema. A first attempt to create an isolated database was denied by the database service. Therefore, this environment validates the migration in a clean **temporary namespace within the configured database**, rather than a completely separate empty database.

## Release gate for a new environment

Before provisioning a new production or staging environment, run the unmodified `0056_nebulous_the_fallen.sql` through the standard Drizzle migration path against that environment's clean database. Confirm the four Early Career tables, `early_career_profiles_user_unique` index, `early_career_intelligence` product/module seed, and the Drizzle migration ledger entry before enabling enrolments.
