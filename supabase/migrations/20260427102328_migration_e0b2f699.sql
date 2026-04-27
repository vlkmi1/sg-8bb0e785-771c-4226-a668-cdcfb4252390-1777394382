-- influencer_videos - smazat duplicitní
DROP POLICY IF EXISTS "Users can create own videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can delete videos from own influencers" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can insert videos for own influencers" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can view own videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Users can view videos from own influencers" ON public.influencer_videos;

CREATE POLICY "influencer_videos_select" ON public.influencer_videos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "influencer_videos_insert" ON public.influencer_videos FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "influencer_videos_delete" ON public.influencer_videos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (SELECT auth.uid())
  )
);