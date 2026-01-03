'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

interface VideoBackgroundProps {
    videos: Video[];
    fallbackImage: string;
    fallbackAlt: string;
}

export default function VideoBackground({ videos, fallbackImage, fallbackAlt }: VideoBackgroundProps) {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playerRef = useRef<any>(null); // To store the YouTube Player instance

    // Filter useful videos (Trailers/Teasers from YouTube)
    const validVideos = videos.filter(v =>
        v.site === 'YouTube' &&
        (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Opening Credits')
    );

    useEffect(() => {
        if (validVideos.length === 0) return;

        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        // Define the global callback for when API is ready
        (window as any).onYouTubeIframeAPIReady = () => {
            loadVideo(0);
        };

        return () => {
            // Cleanup if needed
        };
    }, [validVideos.length]); // Depend on videos availability

    // Effect to handle video changes if we implemented rotation, but for now starts with 0
    // and let the 'onStateChange' handle the loop/next video.

    const loadVideo = (index: number) => {
        if (!validVideos[index]) return;

        const videoId = validVideos[index].key;

        if (playerRef.current) {
            // Player exists, load new video
            playerRef.current.loadVideoById(videoId);
        } else {
            // Initialize new player
            playerRef.current = new (window as any).YT.Player('youtube-player', {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    showinfo: 0,
                    rel: 0,
                    loop: 0, // We handle loop manually to switch videos
                    mute: 1, // Start muted
                    modestbranding: 1,
                    playsinline: 1,
                    iv_load_policy: 3,
                    playlist: videoId // For looping if needed, but we do manual switching
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange
                }
            });
        }
    };

    const onPlayerReady = (event: any) => {
        event.target.mute();
        event.target.playVideo();
        setIsPlayerReady(true);
    };

    const onPlayerStateChange = (event: any) => {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            // Video ended, play next
            const nextIndex = (currentVideoIndex + 1) % validVideos.length;
            setCurrentVideoIndex(nextIndex);
            loadVideo(nextIndex);
        }
    };

    // Handle mid-navigation or refresh where global API implies readiness
    useEffect(() => {
        if (validVideos.length > 0 && (window as any).YT && (window as any).YT.Player && !playerRef.current) {
            loadVideo(currentVideoIndex);
        }
    }, [currentVideoIndex, validVideos.length]);


    return (
        <>
            {/* Fallback Static Image (Always rendered, covered by video when ready) */}
            <Image
                src={fallbackImage}
                alt={fallbackAlt}
                fill
                className="object-cover opacity-50 z-0"
                priority
            />

            {/* Video Overlay */}
            {validVideos.length > 0 && (
                <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${isPlayerReady ? 'opacity-100' : 'opacity-0'} z-10`}>
                    <div id="youtube-player" className="w-[300%] h-[300%] -ml-[100%] -mt-[100%]" />
                </div>
            )}
        </>
    );
}
