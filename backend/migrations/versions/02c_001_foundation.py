"""Initial V2-only immutable draft persistence. Frozen SQL, not runtime metadata.

Schema/version-table bootstrap is explicit in env.py. Downgrade refuses any
retained release; destructive reset belongs only to a disposable Docker volume.
"""

from alembic import op
from sqlalchemy import text

revision = "02c_001"
down_revision = None
branch_labels = None
depends_on = None

STATEMENTS = (
    """
CREATE TABLE cuny_advisor_v2.campus (
	campus_id TEXT NOT NULL,
	PRIMARY KEY (campus_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.category_definition (
	digest TEXT NOT NULL,
	payload JSONB NOT NULL,
	PRIMARY KEY (digest)
)

""",
    """
CREATE TABLE cuny_advisor_v2.catalog_edition (
	campus_id TEXT NOT NULL,
	catalog_year TEXT NOT NULL,
	PRIMARY KEY (campus_id, catalog_year),
	FOREIGN KEY(campus_id) REFERENCES cuny_advisor_v2.campus (campus_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.course_identity (
	campus_id TEXT NOT NULL,
	course_id TEXT NOT NULL,
	PRIMARY KEY (campus_id, course_id),
	FOREIGN KEY(campus_id) REFERENCES cuny_advisor_v2.campus (campus_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.program (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id),
	FOREIGN KEY(campus_id) REFERENCES cuny_advisor_v2.campus (campus_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.catalog_revision (
	campus_id TEXT NOT NULL,
	revision_id TEXT NOT NULL,
	catalog_year TEXT NOT NULL,
	PRIMARY KEY (campus_id, revision_id),
	UNIQUE (campus_id, revision_id, catalog_year),
	FOREIGN KEY(campus_id, catalog_year) REFERENCES cuny_advisor_v2.catalog_edition (campus_id, catalog_year)
)

""",
    """
CREATE TABLE cuny_advisor_v2.course_version (
	campus_id TEXT NOT NULL,
	version_id TEXT NOT NULL,
	course_id TEXT NOT NULL,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, version_id),
	CHECK (length(digest) = 64),
	UNIQUE (campus_id, course_id, version_id),
	CHECK (payload->>'version_id' = version_id),
	CHECK (payload->'identity'->>'id' = course_id),
	CHECK (payload->'identity'->>'campus_id' = campus_id),
	FOREIGN KEY(campus_id, course_id) REFERENCES cuny_advisor_v2.course_identity (campus_id, course_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.program_release_binding (
	campus_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	catalog_year TEXT NOT NULL,
	revision_id TEXT NOT NULL,
	credential TEXT NOT NULL,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, release_id),
	CHECK (length(digest) = 64),
	CHECK (credential IN ('AA', 'AS', 'AAS')),
	CHECK (payload->>'state' = 'draft'),
	CHECK (payload->>'id' = release_id),
	CHECK (payload->>'campus_id' = campus_id),
	CHECK (payload->'program'->>'id' = program_id),
	CHECK (payload->'program'->>'campus_id' = campus_id),
	CHECK (payload->>'catalog_year' = catalog_year),
	CHECK (payload->>'credential' = credential),
	UNIQUE (campus_id, program_id, release_id, digest),
	UNIQUE (campus_id, program_id, release_id),
	FOREIGN KEY(campus_id, program_id) REFERENCES cuny_advisor_v2.program (campus_id, program_id),
	FOREIGN KEY(campus_id, revision_id, catalog_year) REFERENCES cuny_advisor_v2.catalog_revision (campus_id, revision_id, catalog_year)
)

""",
    """
CREATE TABLE cuny_advisor_v2.release_category (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	category_id TEXT NOT NULL,
	category_digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, category_id),
	FOREIGN KEY(category_digest) REFERENCES cuny_advisor_v2.category_definition (digest),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.release_course_version (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	course_id TEXT NOT NULL,
	version_id TEXT NOT NULL,
	position INTEGER NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, course_id),
	FOREIGN KEY(campus_id, course_id, version_id) REFERENCES cuny_advisor_v2.course_version (campus_id, course_id, version_id),
	UNIQUE (campus_id, release_id, position),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.rule_version (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	rule_id TEXT NOT NULL,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, rule_id),
	CHECK (length(digest) = 64),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.source_evidence (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	source_id TEXT NOT NULL,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, source_id),
	CHECK (length(digest) = 64),
	CHECK (payload->>'id' = source_id),
	CHECK (payload->>'campus_id' IS NULL OR payload->>'campus_id' = campus_id),
	CHECK (payload->>'program_id' IS NULL OR payload->>'program_id' = program_id),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.synthetic_evaluation_snapshot (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	snapshot_id TEXT NOT NULL,
	engine_version TEXT NOT NULL,
	release_digest TEXT NOT NULL,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, snapshot_id),
	CHECK (length(digest) = 64),
	FOREIGN KEY(campus_id, program_id, release_id, release_digest) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id, digest),
	CHECK (payload->'release'->>'id' = release_id),
	CHECK (payload->'release'->>'campus_id' = campus_id),
	CHECK (payload->'release'->'program'->>'id' = program_id),
	CHECK (engine_version IN ('02a.1', '02b.1')),
	CHECK (payload->>'engine_version' = engine_version),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.evidence_conflict (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	source_id TEXT NOT NULL,
	other_source_id TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, source_id, other_source_id),
	FOREIGN KEY(campus_id, program_id, release_id, source_id) REFERENCES cuny_advisor_v2.source_evidence (campus_id, program_id, release_id, source_id),
	FOREIGN KEY(campus_id, program_id, release_id, other_source_id) REFERENCES cuny_advisor_v2.source_evidence (campus_id, program_id, release_id, source_id),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.program_requirement (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	requirement_id TEXT NOT NULL,
	rule_id TEXT NOT NULL,
	category_id TEXT,
	payload JSONB NOT NULL,
	digest TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, requirement_id),
	CHECK (length(digest) = 64),
	FOREIGN KEY(campus_id, program_id, release_id, rule_id) REFERENCES cuny_advisor_v2.rule_version (campus_id, program_id, release_id, rule_id),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id),
	FOREIGN KEY(campus_id, program_id, release_id, category_id) REFERENCES cuny_advisor_v2.release_category (campus_id, program_id, release_id, category_id)
)

""",
    """
CREATE TABLE cuny_advisor_v2.rule_source (
	campus_id TEXT NOT NULL,
	program_id TEXT NOT NULL,
	release_id TEXT NOT NULL,
	rule_id TEXT NOT NULL,
	source_id TEXT NOT NULL,
	PRIMARY KEY (campus_id, program_id, release_id, rule_id, source_id),
	FOREIGN KEY(campus_id, program_id, release_id, rule_id) REFERENCES cuny_advisor_v2.rule_version (campus_id, program_id, release_id, rule_id),
	FOREIGN KEY(campus_id, program_id, release_id, source_id) REFERENCES cuny_advisor_v2.source_evidence (campus_id, program_id, release_id, source_id),
	FOREIGN KEY(campus_id, program_id, release_id) REFERENCES cuny_advisor_v2.program_release_binding (campus_id, program_id, release_id)
)

""",
    """CREATE FUNCTION cuny_advisor_v2.deny_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'immutable V2 persistence: append a new identity'; END; $$""",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.campus FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.campus TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.category_definition FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.category_definition TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.catalog_edition FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.catalog_edition TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.course_identity FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.course_identity TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.program FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.program TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.catalog_revision FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.catalog_revision TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.course_version FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.course_version TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.program_release_binding FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.program_release_binding TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.release_category FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.release_category TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.release_course_version FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.release_course_version TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.rule_version FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.rule_version TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.source_evidence FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.source_evidence TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.synthetic_evaluation_snapshot FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.synthetic_evaluation_snapshot TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.evidence_conflict FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.evidence_conflict TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.program_requirement FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.program_requirement TO v2_runtime",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.rule_source FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT, INSERT ON cuny_advisor_v2.rule_source TO v2_runtime",
    "GRANT USAGE ON SCHEMA cuny_advisor_v2 TO v2_runtime",
)


def upgrade():
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade():
    if op.get_bind().scalar(
        text("SELECT count(*) FROM cuny_advisor_v2.program_release_binding")
    ):
        raise RuntimeError("retained catalog history: downgrade refused")
    op.execute("DROP TABLE cuny_advisor_v2.rule_source")
    op.execute("DROP TABLE cuny_advisor_v2.program_requirement")
    op.execute("DROP TABLE cuny_advisor_v2.evidence_conflict")
    op.execute("DROP TABLE cuny_advisor_v2.synthetic_evaluation_snapshot")
    op.execute("DROP TABLE cuny_advisor_v2.source_evidence")
    op.execute("DROP TABLE cuny_advisor_v2.rule_version")
    op.execute("DROP TABLE cuny_advisor_v2.release_course_version")
    op.execute("DROP TABLE cuny_advisor_v2.release_category")
    op.execute("DROP TABLE cuny_advisor_v2.program_release_binding")
    op.execute("DROP TABLE cuny_advisor_v2.course_version")
    op.execute("DROP TABLE cuny_advisor_v2.catalog_revision")
    op.execute("DROP TABLE cuny_advisor_v2.program")
    op.execute("DROP TABLE cuny_advisor_v2.course_identity")
    op.execute("DROP TABLE cuny_advisor_v2.catalog_edition")
    op.execute("DROP TABLE cuny_advisor_v2.category_definition")
    op.execute("DROP TABLE cuny_advisor_v2.campus")
    op.execute("DROP FUNCTION cuny_advisor_v2.deny_mutation()")
