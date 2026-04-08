import pathlib
import functions_framework
from google.cloud import bigquery

DIR_NAME = pathlib.Path(__file__).parent
SQL_DIR_NAME = DIR_NAME / "sql"


@functions_framework.http
def run_sql(request):
    sql_filename = request.args.get(
        "sql",
        "create_derived_current_assessment_bins.sql",
    )
    sql_path = SQL_DIR_NAME / sql_filename

    if not sql_path.exists():
        return f"SQL file not found: {sql_filename}", 404

    with open(sql_path, "r", encoding="utf-8") as f:
        sql_query = f.read()

    client = bigquery.Client()
    client.query_and_wait(sql_query)

    return f"Successfully ran {sql_filename}"
