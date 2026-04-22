CREATE OR REPLACE TABLE `{project_id}.{derived_dataset}.current_assessment_bins` AS
SELECT
    CAST(FLOOR(predicted_value / 10000) * 10000 AS INT64) AS lower_bound,
    CAST(FLOOR(predicted_value / 10000) * 10000 + 10000 AS INT64) AS upper_bound,
    COUNT(*) AS property_count
FROM `{project_id}.{derived_dataset}.current_assessments`
WHERE predicted_value IS NOT NULL
  AND predicted_value >= 0
GROUP BY 1, 2
ORDER BY 1;