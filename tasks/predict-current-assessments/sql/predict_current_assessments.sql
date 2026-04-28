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
