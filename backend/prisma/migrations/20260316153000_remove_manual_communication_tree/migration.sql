DROP TABLE IF EXISTS "CommunicationNode";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NodeType') THEN
    DROP TYPE "NodeType";
  END IF;
END $$;
