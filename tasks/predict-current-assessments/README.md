# Predict Current Assessments

This Cloud Run job trains the current assessment model and writes prediction
output for downstream exports.

## Table Semantics

- `core.opa_assessments` stores official historical assessment records.
- `derived.current_assessments` stores model-generated prediction output, not
  official assessment records.
- `derived.current_assessments.predicted_value` is the model estimate consumed
  by downstream frontend exports and lookup APIs.

## Model Contract

The model predicts `log_sale_price` using these features:

- `total_livable_area`
- `taxable_building`
- `taxable_land`
- `quality_grade`
- `interior_condition_rev`
- `exterior_condition_rev`
- `garage_spaces`
- `year_built_int`

The `assessment_year` field is intentionally excluded from the model feature
set because it was null for all prediction rows.
