-- Local demo data. The email guard deliberately prevents seeding any other account.
DO $$
DECLARE
  target_account uuid;
  client_a uuid;
  client_b uuid;
  cleaning_offer uuid;
  windows_offer uuid;
BEGIN
  SELECT membership.account_id INTO target_account
  FROM users account_user
  JOIN provider_memberships membership ON membership.user_id = account_user.id
  WHERE lower(account_user.email) = lower('kounterstrike6@gmail.com')
  LIMIT 1;

  IF target_account IS NULL THEN
    RAISE EXCEPTION 'Target provider account was not found';
  END IF;

  SELECT id INTO client_a FROM provider_clients WHERE account_id = target_account AND name = 'Klient testowy A' LIMIT 1;
  SELECT id INTO client_b FROM provider_clients WHERE account_id = target_account AND name = 'Klient testowy B' LIMIT 1;
  SELECT id INTO cleaning_offer FROM provider_offers WHERE account_id = target_account AND title = 'TEST · Sprzątanie mieszkania' LIMIT 1;
  SELECT id INTO windows_offer FROM provider_offers WHERE account_id = target_account AND title = 'TEST · Mycie okien' LIMIT 1;

  IF client_a IS NULL OR client_b IS NULL OR cleaning_offer IS NULL OR windows_offer IS NULL THEN
    RAISE EXCEPTION 'Target account test clients or offers are missing';
  END IF;

  INSERT INTO provider_multi_orders
    (id, account_id, client_id, offer_id, client_name, service_title, service_detail, start_date, end_date, area_square_meters, add_on_count, total_price_minor, external, status, sessions, notes, revision)
  VALUES
    ('20000000-0000-4000-8000-000000000001', target_account, client_a, cleaning_offer, 'Klient testowy A', 'Sprzątanie mieszkania', 'Pakiet regularny', '2026-10-10', '2026-10-14', 83, 2, 124500, false, 'pending',
      '[{"date":"2026-10-10","startMinute":540,"durationMinutes":120,"employeeId":null},{"date":"2026-10-11","startMinute":540,"durationMinutes":120,"employeeId":null},{"date":"2026-10-12","startMinute":540,"durationMinutes":120,"employeeId":null},{"date":"2026-10-13","startMinute":540,"durationMinutes":120,"employeeId":null},{"date":"2026-10-14","startMinute":540,"durationMinutes":120,"employeeId":null}]'::jsonb,
      'Testowe zlecenie cykliczne: pięć porannych sesji.', 1),
    ('20000000-0000-4000-8000-000000000002', target_account, client_b, windows_offer, 'Klient testowy B', 'Mycie okien', 'Okna i witryny', '2026-10-17', '2026-10-20', 120, 1, 96800, true, 'pending',
      '[{"date":"2026-10-17","startMinute":600,"durationMinutes":150,"employeeId":null},{"date":"2026-10-18","startMinute":600,"durationMinutes":150,"employeeId":null},{"date":"2026-10-19","startMinute":600,"durationMinutes":150,"employeeId":null},{"date":"2026-10-20","startMinute":600,"durationMinutes":150,"employeeId":null}]'::jsonb,
      'Zlecenie zewnętrzne, wejście od strony parkingu.', 1),
    ('20000000-0000-4000-8000-000000000003', target_account, client_a, cleaning_offer, 'Klient testowy A', 'Sprzątanie mieszkania', 'Pakiet po remoncie', '2026-10-24', '2026-10-26', 64, 3, 73500, false, 'pending',
      '[{"date":"2026-10-24","startMinute":780,"durationMinutes":180,"employeeId":null},{"date":"2026-10-25","startMinute":780,"durationMinutes":180,"employeeId":null},{"date":"2026-10-26","startMinute":780,"durationMinutes":180,"employeeId":null}]'::jsonb,
      'Trzy popołudniowe sesje testowe.', 1)
  ON CONFLICT (id) DO NOTHING;
END $$;
