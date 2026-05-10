-- Create Enum Types
CREATE TYPE resume_upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE interview_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Trigger for automatically creating profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. resumes
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    original_resume_name TEXT NOT NULL,
    original_resume_text TEXT,
    original_resume_file_url TEXT,
    ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
    strengths JSONB,
    weaknesses JSONB,
    missing_keywords JSONB,
    ai_feedback TEXT,
    upload_status resume_upload_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resumes" 
    ON public.resumes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" 
    ON public.resumes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
    ON public.resumes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
    ON public.resumes FOR DELETE 
    USING (auth.uid() = user_id);


-- 3. refined_resumes
CREATE TABLE public.refined_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    refined_resume_text TEXT NOT NULL,
    refined_resume_summary TEXT,
    improvement_notes TEXT,
    generated_version_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refined_resumes_resume_id ON public.refined_resumes(resume_id);
CREATE INDEX idx_refined_resumes_user_id ON public.refined_resumes(user_id);

CREATE TRIGGER update_refined_resumes_updated_at
    BEFORE UPDATE ON public.refined_resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.refined_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refined resumes" 
    ON public.refined_resumes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own refined resumes" 
    ON public.refined_resumes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own refined resumes" 
    ON public.refined_resumes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own refined resumes" 
    ON public.refined_resumes FOR DELETE 
    USING (auth.uid() = user_id);


-- 4. interview_sessions
CREATE TABLE public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    interview_level interview_level NOT NULL DEFAULT 'intermediate',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    ai_decision TEXT,
    interview_status interview_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_resume_id ON public.interview_sessions(resume_id);

CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON public.interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview sessions" 
    ON public.interview_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions" 
    ON public.interview_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" 
    ON public.interview_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview sessions" 
    ON public.interview_sessions FOR DELETE 
    USING (auth.uid() = user_id);


-- 5. interview_questions
CREATE TABLE public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    ai_feedback TEXT,
    answer_score INTEGER CHECK (answer_score >= 0 AND answer_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_questions_session_id ON public.interview_questions(session_id);

CREATE TRIGGER update_interview_questions_updated_at
    BEFORE UPDATE ON public.interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview questions" 
    ON public.interview_questions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own interview questions" 
    ON public.interview_questions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own interview questions" 
    ON public.interview_questions FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own interview questions" 
    ON public.interview_questions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

-- 6. Storage Bucket for Resumes (Optional, but best practice)
-- Requires Supabase storage schema to be active
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload their own resumes"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can view their own resumes"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can update their own resumes"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own resumes"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );
