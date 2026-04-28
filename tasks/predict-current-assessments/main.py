from pathlib import Path

from google.cloud import bigquery

PROJECT_ID = "musa5090s26-team1"
LOCATION = "us-east4"
SQL_DIR = Path(__file__).parent / "sql"


def read_sql(filename: str) -> str:
    return (SQL_DIR / filename).read_text(encoding="utf-8")


def run_query(client: bigquery.Client, sql: str, label: str) -> None:
    print(f"Starting: {label}")
    job = client.query(sql, location=LOCATION)
    job.result()
    print(f"Finished: {label}")


def main():
    client = bigquery.Client(project=PROJECT_ID)

    run_query(client, read_sql("train_model.sql"), "train model")
    run_query(client, read_sql("build_prediction_input.sql"), "build prediction input")
    run_query(client, read_sql("predict_current_assessments.sql"), "write current assessments")

    print("All steps completed successfully.")


if __name__ == "__main__":
    main()
