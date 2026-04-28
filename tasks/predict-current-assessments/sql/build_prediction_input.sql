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
