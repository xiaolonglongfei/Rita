import { pool } from "@workspace/db";
import { logger } from "./logger";
import bcrypt from "bcryptjs";

export async function migrateSupabaseIfNeeded() {
  if (!process.env.SUPABASE_DATABASE_URL) return;

  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS instructors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT,
        specialty TEXT NOT NULL,
        photo_url TEXT,
        location TEXT,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        avg_score REAL NOT NULL DEFAULT 0,
        avg_value REAL NOT NULL DEFAULT 0,
        avg_effectiveness REAL NOT NULL DEFAULT 0,
        avg_punctuality REAL NOT NULL DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        public_rank INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        instructor_id INTEGER NOT NULL REFERENCES instructors(id),
        session_date DATE NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        instructor_id INTEGER NOT NULL REFERENCES instructors(id),
        session_id INTEGER REFERENCES sessions(id),
        value REAL NOT NULL,
        effectiveness REAL NOT NULL,
        punctuality REAL NOT NULL,
        overall_score REAL NOT NULL,
        comment TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        moderation_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        related_instructor_id INTEGER REFERENCES instructors(id),
        related_review_id INTEGER REFERENCES reviews(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session ("expire");
    `);
    logger.info("Supabase schema ready");

    // Check if already seeded
    const { rows } = await client.query("SELECT COUNT(*) AS cnt FROM users");
    if (parseInt(rows[0].cnt) > 0) {
      logger.info("Supabase already seeded — skipping");
      return;
    }

    // Seed users
    const hash = await bcrypt.hash("password123", 12);
    const { rows: users } = await client.query(
      `INSERT INTO users (name, email, password_hash, is_admin) VALUES
        ('Admin User',   'admin@rita.app',    $1, TRUE),
        ('Alex Chen',    'alex@example.com',  $1, FALSE),
        ('Maria Santos', 'maria@example.com', $1, FALSE)
       RETURNING id, email`,
      [hash]
    );
    const alexId  = users.find((u: {email: string; id: number}) => u.email === "alex@example.com")!.id;
    const mariaId = users.find((u: {email: string; id: number}) => u.email === "maria@example.com")!.id;
    logger.info("Supabase users seeded");

    // Seed instructors
    const { rows: instructors } = await client.query(`
      INSERT INTO instructors (name, bio, specialty, location, verified) VALUES
      ('Martin Miedzowicz',
       'Program Director at Tarry Crest Swim & Tennis. Native of Montevideo, Uruguay, former professional player ranked among the top in Uruguay and South America. Elite USPTA, PPTA, and ITF certified with 12+ years of experience in Westchester. Former Director of Tennis at Evolution Tennis Academy and Tennis Manager at Pleasantville Tennis Club. Currently works with over 300 players during the indoor season.',
       'Tennis', 'Tarry Crest Swim & Tennis, Tarrytown, NY', FALSE),
      ('Claudia Bartolome',
       'Head Tennis Professional. Born and raised in Barcelona, Spain. Former top-4 player in Spain under 16 & 18. Played college tennis at University of Pittsburgh and Southern Methodist University. Holds a Masters degree in Sports Management from SMU.',
       'Tennis', 'Tarry Crest Swim & Tennis, Tarrytown, NY', FALSE),
      ('Jose Nunez Navarro',
       'Head Tennis Professional, known as Pepe. Former Division 1 athlete at Old Dominion University. Ranked top-50 nationally in singles and doubles. 7+ years coaching experience including at Shore and Country Club in Connecticut and Soto Tennis Academy in Spain.',
       'Tennis', 'Tarry Crest Swim & Tennis, Tarrytown, NY', FALSE),
      ('Santiago Kearney',
       'Tennis Professional, known as Torito. Born and raised in Buenos Aires, Argentina. Competed at DII NCAA level, ranked top-25 in singles and top-20 in doubles nationally.',
       'Tennis', 'Tarry Crest Swim & Tennis, Tarrytown, NY', FALSE),
      ('Tao Castillo Bernal',
       'Tennis Professional. Born and raised in Spain, started playing tennis at age 6. Former top-25 junior player in Spain. Played college tennis at Georgia Southern University where he holds the record for best tennis record in program history.',
       'Tennis', 'Tarry Crest Swim & Tennis, Tarrytown, NY', FALSE),
      ('Patrick Hammers',
       'Director of Racquet Sports at Pound Ridge Tennis Club. Offers individual and group lessons for all levels. Runs instructional drills for club teams and heads the Junior Clinics program in Spring, Summer, and Fall.',
       'Tennis', 'Pound Ridge Tennis Club, Pound Ridge, NY', FALSE),
      ('Cesar Andrade',
       'Regional Director of Operations at Tennis Innovators Academy, White Plains. Coaching professional and standard in Westchester County tennis instruction.',
       'Tennis', 'Tennis Innovators Academy, White Plains, NY', FALSE),
      ('Vladimir Margalitadze',
       'Regional Director of Tennis at Tennis Innovators Academy, White Plains. Experienced tennis professional serving Westchester County players.',
       'Tennis', 'Tennis Innovators Academy, White Plains, NY', FALSE),
      ('Steve Higgins',
       'Director of Operations at Tennis Innovators Academy, White Plains. Tennis coaching professional with experience across all age groups and skill levels.',
       'Tennis', 'Tennis Innovators Academy, White Plains, NY', FALSE),
      ('Grand Slam Teaching Staff',
       'Professional teaching staff at Grand Slam Tennis Club, Bedford NY. Serving players from Bedford to Greenwich CT and all Westchester County communities. Specializing in adult and junior tennis lessons for all ages and ability levels.',
       'Tennis', 'Grand Slam Tennis Club, Bedford, NY', FALSE)
      RETURNING id, name
    `);
    logger.info({ count: instructors.length }, "Supabase instructors seeded");

    const byName = (n: string) => instructors.find((i: {name: string; id: number}) => i.name === n)!.id;
    const martinId  = byName('Martin Miedzowicz');
    const claudiaId = byName('Claudia Bartolome');
    const pepeId    = byName('Jose Nunez Navarro');
    const patrickId = byName('Patrick Hammers');
    const cesarId   = byName('Cesar Andrade');
    const vladId    = byName('Vladimir Margalitadze');

    // Seed reviews
    await client.query(`
      INSERT INTO reviews (user_id, instructor_id, value, effectiveness, punctuality, overall_score, comment, status)
      VALUES
      ($1,$3,  5.0,4.5,5.0,4.83,'Martin is exceptional. His professional background really shows — deep tactical knowledge and great at adapting to your level.','approved'),
      ($2,$3,  4.5,5.0,4.5,4.67,'Best coach in Westchester. Completely transformed my serve in 4 sessions. Highly recommend.','approved'),
      ($1,$4,  4.5,4.5,5.0,4.67,'Claudia brings incredible patience and technical depth. Her European training background is clear in every drill.','approved'),
      ($2,$4,  5.0,4.0,4.5,4.50,'Great instructor. Really understands junior development. My daughter improved significantly.','approved'),
      ($1,$5,  4.0,4.5,4.0,4.17,'Pepe is fantastic for competitive players. He pushes you hard but explains everything clearly.','approved'),
      ($2,$5,  4.5,4.0,4.5,4.33,'Excellent D1 coaching pedigree. Focused on the right fundamentals without overcomplicating things.','approved'),
      ($1,$6,  4.0,4.0,4.5,4.17,'Patrick runs tight clinics. Very organized, good eye for technique. Junior program is excellent.','approved'),
      ($2,$6,  4.5,4.5,4.0,4.33,'Great value for group lessons. Pound Ridge is a beautiful club and Patrick makes it worth the drive.','approved'),
      ($1,$7,  3.5,4.0,4.0,3.83,'Good instructor, solid fundamentals focus. Worth trying if you are in White Plains.','approved'),
      ($2,$7,  4.0,3.5,4.0,3.83,'Cesar is very methodical. Good for beginners and intermediate players who want structure.','approved'),
      ($1,$8,  3.5,3.5,4.0,3.67,'Solid coach. Good with consistency drills and court positioning.','approved'),
      ($2,$8,  4.0,4.0,3.5,3.83,'Vladimir has a calm teaching style that works well. Improved my backhand in a few sessions.','approved')
    `, [alexId, mariaId, martinId, claudiaId, pepeId, patrickId, cesarId, vladId]);
    logger.info("Supabase reviews seeded");

    // Recompute instructor stats
    await client.query(`
      UPDATE instructors i SET
        avg_value         = sub.avg_v,
        avg_effectiveness = sub.avg_e,
        avg_punctuality   = sub.avg_p,
        avg_score         = sub.avg_o,
        review_count      = sub.cnt
      FROM (
        SELECT instructor_id,
          AVG(value)::real         AS avg_v,
          AVG(effectiveness)::real AS avg_e,
          AVG(punctuality)::real   AS avg_p,
          AVG(overall_score)::real AS avg_o,
          COUNT(*)::int            AS cnt
        FROM reviews WHERE status = 'approved'
        GROUP BY instructor_id
      ) sub
      WHERE i.id = sub.instructor_id
    `);
    logger.info("Supabase instructor stats recomputed");
    logger.info("✅ Supabase migration complete");
  } catch (err) {
    logger.error({ err }, "Supabase migration failed");
  } finally {
    client.release();
  }
}
