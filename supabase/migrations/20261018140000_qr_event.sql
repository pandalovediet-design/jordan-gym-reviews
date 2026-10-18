-- QR sticker scans are counted as their own analytics event.
alter type public.analytics_event_type add value if not exists 'qr_scan';
