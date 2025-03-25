#!/bin/bash

DB_PATH="./sms_gateway.db"

sqlite3 $DB_PATH "
PRAGMA foreign_keys = OFF;
DELETE FROM inbox;
DELETE FROM outbox;
DELETE FROM sentitems;
PRAGMA foreign_keys = ON;"

echo "All data has been cleared from the database."