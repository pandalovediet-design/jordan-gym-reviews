-- Track visits that arrive through a printed QR poster.
alter type public.analytics_event_type add value if not exists 'qr_visit';
