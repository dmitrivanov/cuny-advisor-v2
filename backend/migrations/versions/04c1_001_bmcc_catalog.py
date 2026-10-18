"""Append-only BMCC source browsing snapshots; existing academic releases untouched."""

from alembic import op
from sqlalchemy import text

revision = "04c1_001"
down_revision = "04b_001"
branch_labels = None
depends_on = None
STATEMENTS = (
    "\nCREATE TABLE cuny_advisor_v2.browse_catalog_snapshot (\n\tsnapshot_id TEXT NOT NULL, \n\tcampus_id TEXT NOT NULL, \n\tcatalog_year TEXT NOT NULL, \n\tpayload JSONB NOT NULL, \n\tdigest TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id), \n\tCHECK (length(digest) = 64), \n\tFOREIGN KEY(campus_id) REFERENCES cuny_advisor_v2.campus (campus_id), \n\tUNIQUE (snapshot_id, campus_id, catalog_year), \n\tCHECK (campus_id='bmcc')\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_catalog_snapshot FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_catalog_snapshot TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_catalog_source (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tpayload JSONB NOT NULL, \n\tdigest TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id), \n\tCHECK (length(digest) = 64), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.browse_catalog_snapshot (snapshot_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_catalog_source FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_catalog_source TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_catalog_department (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tpayload JSONB NOT NULL, \n\tdigest TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id), \n\tCHECK (length(digest) = 64), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.browse_catalog_snapshot (snapshot_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_catalog_department FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_catalog_department TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_catalog_program (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tpayload JSONB NOT NULL, \n\tdigest TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id), \n\tCHECK (length(digest) = 64), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.browse_catalog_snapshot (snapshot_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_catalog_program FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_catalog_program TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_catalog_course (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tcode TEXT NOT NULL, \n\tpayload JSONB NOT NULL, \n\tdigest TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id), \n\tUNIQUE (snapshot_id, code), \n\tCHECK (length(digest) = 64), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.browse_catalog_snapshot (snapshot_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_catalog_course FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_catalog_course TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_course_department (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tdepartment_id TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id, department_id), \n\tFOREIGN KEY(snapshot_id, entity_id) REFERENCES cuny_advisor_v2.browse_catalog_course (snapshot_id, entity_id), \n\tFOREIGN KEY(snapshot_id, department_id) REFERENCES cuny_advisor_v2.browse_catalog_department (snapshot_id, entity_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_course_department FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_course_department TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.browse_program_department (\n\tsnapshot_id TEXT NOT NULL, \n\tentity_id TEXT NOT NULL, \n\tdepartment_id TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, entity_id, department_id), \n\tFOREIGN KEY(snapshot_id, entity_id) REFERENCES cuny_advisor_v2.browse_catalog_program (snapshot_id, entity_id), \n\tFOREIGN KEY(snapshot_id, department_id) REFERENCES cuny_advisor_v2.browse_catalog_department (snapshot_id, entity_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.browse_program_department FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.browse_program_department TO v2_runtime",
)


def upgrade():
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade():
    if op.get_bind().scalar(
        text("SELECT count(*) FROM cuny_advisor_v2.browse_catalog_snapshot")
    ):
        raise RuntimeError("Retained browsing snapshots: downgrade refused")
    op.execute("DROP TABLE cuny_advisor_v2.browse_program_department")
    op.execute("DROP TABLE cuny_advisor_v2.browse_course_department")
    op.execute("DROP TABLE cuny_advisor_v2.browse_catalog_course")
    op.execute("DROP TABLE cuny_advisor_v2.browse_catalog_program")
    op.execute("DROP TABLE cuny_advisor_v2.browse_catalog_department")
    op.execute("DROP TABLE cuny_advisor_v2.browse_catalog_source")
    op.execute("DROP TABLE cuny_advisor_v2.browse_catalog_snapshot")
