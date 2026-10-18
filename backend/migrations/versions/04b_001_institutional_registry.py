"""Append-only public institutional registry; no catalog record rewrites."""

from alembic import op
from sqlalchemy import text

revision = "04b_001"
down_revision = "02c_001"
branch_labels = None
depends_on = None
STATEMENTS = (
    "\nCREATE TABLE cuny_advisor_v2.institution_registry_snapshot (\n\tsnapshot_id TEXT NOT NULL, \n\tretrieved_on DATE NOT NULL, \n\tscope_source TEXT NOT NULL, \n\tdigest TEXT NOT NULL, \n\tinstitution_count INTEGER NOT NULL, \n\tPRIMARY KEY (snapshot_id), \n\tCHECK (length(digest)=64), \n\tCHECK (institution_count >= 0)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.institution_registry_snapshot FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.institution_registry_snapshot TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.institution (\n\tinstitution_id TEXT NOT NULL, \n\tslug TEXT NOT NULL, \n\tsupport_status TEXT NOT NULL, \n\tPRIMARY KEY (institution_id), \n\tFOREIGN KEY(institution_id) REFERENCES cuny_advisor_v2.campus (campus_id), \n\tUNIQUE (slug), \n\tCHECK (institution_id ~ '^[a-z][a-z0-9-]{0,79}$'), \n\tCHECK (slug ~ '^[a-z][a-z0-9-]{0,79}$'), \n\tCHECK (support_status IN ('pilot','planned')), \n\tCHECK (support_status <> 'pilot' OR institution_id = 'bmcc')\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.institution FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.institution TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.institution_registry_source (\n\tsnapshot_id TEXT NOT NULL, \n\tsource_id TEXT NOT NULL, \n\turl TEXT NOT NULL, \n\ttitle TEXT NOT NULL, \n\tretrieved_on DATE NOT NULL, \n\tPRIMARY KEY (snapshot_id, source_id), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.institution_registry_snapshot (snapshot_id), \n\tUNIQUE (snapshot_id, url), \n\tCHECK (url ~ '^https?://')\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.institution_registry_source FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.institution_registry_source TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.institution_revision (\n\tsnapshot_id TEXT NOT NULL, \n\tinstitution_id TEXT NOT NULL, \n\tofficial_name TEXT NOT NULL, \n\tdisplay_name TEXT NOT NULL, \n\tcategory TEXT NOT NULL, \n\tactive BOOLEAN NOT NULL, \n\twebsite TEXT NOT NULL, \n\tclassification_note TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, institution_id), \n\tFOREIGN KEY(snapshot_id) REFERENCES cuny_advisor_v2.institution_registry_snapshot (snapshot_id), \n\tFOREIGN KEY(institution_id) REFERENCES cuny_advisor_v2.institution (institution_id), \n\tUNIQUE (snapshot_id, official_name), \n\tCHECK (category IN ('community_college','senior_college','graduate_professional','honors_college')), \n\tCHECK (length(official_name)>0 AND length(display_name)>0), \n\tCHECK (website ~ '^https?://')\n)\n\n",
    "CREATE INDEX ix_institution_revision_category ON cuny_advisor_v2.institution_revision (category) INCLUDE (institution_id)",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.institution_revision FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.institution_revision TO v2_runtime",
    "\nCREATE TABLE cuny_advisor_v2.institution_source_reference (\n\tsnapshot_id TEXT NOT NULL, \n\tinstitution_id TEXT NOT NULL, \n\tsource_id TEXT NOT NULL, \n\tlocator TEXT NOT NULL, \n\tPRIMARY KEY (snapshot_id, institution_id, source_id), \n\tFOREIGN KEY(snapshot_id, institution_id) REFERENCES cuny_advisor_v2.institution_revision (snapshot_id, institution_id), \n\tFOREIGN KEY(snapshot_id, source_id) REFERENCES cuny_advisor_v2.institution_registry_source (snapshot_id, source_id)\n)\n\n",
    "CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON cuny_advisor_v2.institution_source_reference FOR EACH ROW EXECUTE FUNCTION cuny_advisor_v2.deny_mutation()",
    "GRANT SELECT ON cuny_advisor_v2.institution_source_reference TO v2_runtime",
)


def upgrade():
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade():
    if op.get_bind().scalar(
        text("SELECT count(*) FROM cuny_advisor_v2.institution_registry_snapshot")
    ):
        raise RuntimeError("Retained institutional snapshots: downgrade refused")
    op.execute("DROP TABLE cuny_advisor_v2.institution_source_reference")
    op.execute("DROP TABLE cuny_advisor_v2.institution_revision")
    op.execute("DROP TABLE cuny_advisor_v2.institution_registry_source")
    op.execute("DROP TABLE cuny_advisor_v2.institution")
    op.execute("DROP TABLE cuny_advisor_v2.institution_registry_snapshot")
