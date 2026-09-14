ALTER TABLE "CalendarFeed" ADD COLUMN "colorSlot" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "colorSlot" TEXT;
ALTER TABLE "Project" ADD COLUMN "colorSlot" TEXT;

-- Preserve stable palette identity for every color Sunnie has previously
-- offered. Provider-supplied feed colors receive a stable event slot so
-- imported calendars participate in colorway changes too.
UPDATE "CalendarFeed"
SET "colorSlot" = CASE
  WHEN UPPER("color") IN ('#9BC7D9','#8FA05A','#E1B94F','#D94F45','#91B4C4') THEN 'event-1'
  WHEN UPPER("color") IN ('#7397C7','#C94F3D','#719DB5','#E7A4A5','#718CA4','#3B82F6') THEN 'event-2'
  WHEN UPPER("color") IN ('#A7ACE0','#8E3F36','#879AA1','#E9B94F','#A9A4BE','#807CB7') THEN 'event-3'
  WHEN UPPER("color") IN ('#78B8B3','#667D8A','#71906C','#6F925F','#557264','#4F8F91') THEN 'event-4'
  WHEN UPPER("color") IN ('#7F9B83','#D6A84B','#A89CC2','#B88663','#C98282','#668779') THEN 'event-5'
  WHEN UPPER("color") IN ('#E9A66F','#C77C43','#D98287','#75A8BC','#A45E67','#DF8F5E') THEN 'event-6'
  WHEN UPPER("color") IN ('#C98772','#667255','#82B5A5','#A58AB3','#B88C70') THEN 'event-7'
  WHEN UPPER("color") IN ('#9B7A86','#C98D91','#6592A0','#72A68C','#D5AE68') THEN 'event-8'
  ELSE 'event-' || ((get_byte(decode(md5("id"), 'hex'), 0) % 8) + 1)::text
END;

UPDATE "CalendarEvent"
SET "colorSlot" = CASE
  WHEN UPPER("color") IN ('#9BC7D9','#8FA05A','#E1B94F','#D94F45','#91B4C4') THEN 'event-1'
  WHEN UPPER("color") IN ('#7397C7','#C94F3D','#719DB5','#E7A4A5','#718CA4','#3B82F6') THEN 'event-2'
  WHEN UPPER("color") IN ('#A7ACE0','#8E3F36','#879AA1','#E9B94F','#A9A4BE','#807CB7') THEN 'event-3'
  WHEN UPPER("color") IN ('#78B8B3','#667D8A','#71906C','#6F925F','#557264','#4F8F91') THEN 'event-4'
  WHEN UPPER("color") IN ('#7F9B83','#D6A84B','#A89CC2','#B88663','#C98282','#668779') THEN 'event-5'
  WHEN UPPER("color") IN ('#E9A66F','#C77C43','#D98287','#75A8BC','#A45E67','#DF8F5E') THEN 'event-6'
  WHEN UPPER("color") IN ('#C98772','#667255','#82B5A5','#A58AB3','#B88C70') THEN 'event-7'
  WHEN UPPER("color") IN ('#9B7A86','#C98D91','#6592A0','#72A68C','#D5AE68') THEN 'event-8'
END
WHERE "color" IS NOT NULL;

UPDATE "Project"
SET "colorSlot" = CASE
  WHEN UPPER("color") IN ('#F4D27D','#D97836','#D8A3A5','#C95043','#B77D59') THEN 'project-1'
  WHEN UPPER("color") IN ('#F2BE8F','#E4A65C','#B5A6C5','#71885B','#A96455') THEN 'project-2'
  WHEN UPPER("color") IN ('#DFA7A7','#D3B66E','#E5B7C4','#D7AE78','#DED0B5') THEN 'project-3'
  WHEN UPPER("color") IN ('#BDD39A','#7A8052','#9DAE8A','#C9784D','#C57878','#D5DD8D') THEN 'project-4'
  WHEN UPPER("color") IN ('#DFCDA6','#B96547','#E5C875','#91A75E','#8FA58D','#DCA58E') THEN 'project-5'
  WHEN UPPER("color") IN ('#AFC28D','#92715D','#8FAFC0','#6E91A2','#96788F') THEN 'project-6'
END
WHERE "color" IS NOT NULL;
