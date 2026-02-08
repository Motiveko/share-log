-- Log 테이블에 description(내역) 컬럼 추가 및 기존 memo 데이터 마이그레이션
-- dev 환경: synchronize: true이므로 entity 변경만으로 컬럼 자동 생성됨, UPDATE문만 실행
-- prod 환경: 이 스크립트 전체 실행

-- 1. description 컬럼 추가 (이미 없는 경우)
ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "description" text;

-- 2. 기존 memo 데이터를 description으로 복사
UPDATE "Log" SET "description" = "memo" WHERE "memo" IS NOT NULL AND "description" IS NULL;
