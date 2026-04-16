/*
  # Deactivate old parcel lockers with incorrect addresses

  1. Changes
    - Deactivate all existing Omniva and LP Express parcel lockers that contain incorrect
      or mismatched data (same addresses reused across both providers)
    - Rename old locker_code with "OLD_" prefix to free up clean codes for new correct data
  
  2. Notes
    - Order history is preserved as rows are not deleted
    - Only is_active flag is changed, so FK references remain intact
*/

UPDATE parcel_lockers
SET is_active = false,
    locker_code = 'OLD_' || locker_code,
    updated_at = now()
WHERE provider IN ('Omniva', 'LP Express')
  AND locker_code NOT LIKE 'OLD_%';
