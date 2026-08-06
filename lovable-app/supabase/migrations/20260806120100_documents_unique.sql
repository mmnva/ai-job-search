-- Unique doc per type per application (for upsert)
create unique index if not exists documents_app_type_uidx
  on public.documents (application_id, doc_type);
