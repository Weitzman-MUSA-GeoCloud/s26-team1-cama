from google.cloud import bigquery

PROJECT_ID = "musa5090s26-team1"
LOCATION = "us-east4"

TRAIN_SQL = """
CREATE OR REPLACE MODEL `musa5090s26-team1.derived.sale_price_boosted_tree_v2`
OPTIONS(
  model_type = 'BOOSTED_TREE_REGRESSOR',
  input_label_cols = ['log_sale_price']
) AS
SELECT
  log_sale_price,
  total_livable_area,
  taxable_building,
  taxable_land,
  quality_grade,
  interior_condition_rev,
  exterior_condition_rev,
  garage_spaces,
  assessment_year,
  year_built_int
FROM `musa5090s26-team1.derived.current_assessments_model_training_data_cleaned_v2`
WHERE log_sale_price IS NOT NULL
"""

BUILD_PREDICTION_INPUT_SQL = """
CREATE OR REPLACE TABLE `musa5090s26-team1.derived.current_assessments_prediction_input` AS
SELECT
  property_id,
  SAFE_CAST(total_livable_area AS FLOAT64) AS total_livable_area,
  SAFE_CAST(taxable_building AS FLOAT64) AS taxable_building,
  SAFE_CAST(taxable_land AS FLOAT64) AS taxable_land,
  quality_grade,
  SAFE_CAST(garage_spaces AS FLOAT64) AS garage_spaces,
  EXTRACT(YEAR FROM SAFE.PARSE_DATE('%Y-%m-%d', assessment_date)) AS assessment_year,
  SAFE_CAST(year_built AS INT64) AS year_built_int,
  CASE
    WHEN SAFE_CAST(interior_condition AS INT64) IS NOT NULL
      THEN 8 - SAFE_CAST(interior_condition AS INT64)
    ELSE NULL
  END AS interior_condition_rev,
  CASE
    WHEN SAFE_CAST(exterior_condition AS INT64) IS NOT NULL
      THEN 8 - SAFE_CAST(exterior_condition AS INT64)
    ELSE NULL
  END AS exterior_condition_rev
FROM `musa5090s26-team1.core.opa_properties`
WHERE property_id IS NOT NULL
  AND category_code_description IN (
    'SINGLE FAMILY',
    'MULTI FAMILY',
    'APARTMENTS > 4 UNITS',
    'VACANT LAND - RESIDENTIAL',
    'GARAGE - RESIDENTIAL'
  )
"""

PREDICT_SQL = """
CREATE OR REPLACE TABLE `musa5090s26-team1.derived.current_assessments` AS
SELECT
  property_id,
  EXP(predicted_log_sale_price) AS predicted_value,
  CURRENT_TIMESTAMP() AS predicted_at
FROM ML.PREDICT(
  MODEL `musa5090s26-team1.derived.sale_price_boosted_tree_v2`,
  (
    SELECT
      property_id,
      total_livable_area,
      taxable_building,
      taxable_land,
      quality_grade,
      interior_condition_rev,
      exterior_condition_rev,
      garage_spaces,
      assessment_year,
      year_built_int
    FROM `musa5090s26-team1.derived.current_assessments_prediction_input`
  )
)
"""


def run_query(client: bigquery.Client, sql: str, label: str) -> None:
    print(f"Starting: {label}")
    job = client.query(sql, location=LOCATION)
    job.result()
    print(f"Finished: {label}")


def main():
    client = bigquery.Client(project=PROJECT_ID)
    run_query(client, TRAIN_SQL, "train model")
    run_query(client, BUILD_PREDICTION_INPUT_SQL, "build prediction input")
    run_query(client, PREDICT_SQL, "write current assessments")
    print("All steps completed successfully.")


if __name__ == "__main__":
    main()