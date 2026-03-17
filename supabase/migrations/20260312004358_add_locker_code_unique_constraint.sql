/*
  # Pridedamas unikalumo apribojimas paštomatų kodams
*/
ALTER TABLE parcel_lockers ADD CONSTRAINT parcel_lockers_locker_code_key UNIQUE (locker_code);
