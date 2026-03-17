import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  FileText, 
  MessageSquare,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Send
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CoursePlayer = () => {
  const { id } = useParams();
  const [currentLesson, setCurrentLesson] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set(["0-0", "0-1", "1-0"]));
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Discussion state
  const [newDiscussion, setNewDiscussion] = useState("");
  const [newReply, setNewReply] = useState("");

  const totalLessons = curriculum.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
  const progress = (completedLessons.size / totalLessons) * 100;

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.parentElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Mark lesson as complete when 90% watched
      if (video.currentTime / video.duration > 0.9) {
        const lessonKey = `${Math.floor(currentLesson / 10)}-${currentLesson % 10}`;
        if (!completedLessons.has(lessonKey)) {
          setCompletedLessons(prev => new Set([...prev, lessonKey]));
          toast({
            title: "Lesson completed! 🎉",
            description: "Great job! Keep up the momentum.",
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentLesson, completedLessons]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Complete Web Development Bootcamp</h1>
              <p className="text-sm text-muted-foreground">by John Smith</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Your progress:</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
              <Progress value={progress} className="w-32" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? "Hide" : "Show"} Content
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="bg-black aspect-video w-full relative group">
            <video
              ref={videoRef}
              className="w-full h-full"
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              onClick={togglePlay}
            />
            
            {/* Play/Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
                <Button size="lg" variant="secondary" className="rounded-full h-20 w-20 animate-pulse-glow">
                  <Play className="h-10 w-10" />
                </Button>
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-smooth">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 mb-3 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:text-white hover:bg-white/20">
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:text-white hover:bg-white/20">
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <div className="border-b border-border px-6">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome to the course</h2>
                      <p className="text-muted-foreground">
                        In this lesson, you'll get an overview of what you'll learn throughout the course 
                        and how to make the most of your learning experience.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">In this lesson:</h3>
                      <ul className="space-y-2">
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <span>Course structure and learning path</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <span>How to set up your development environment</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <span>Tips for effective learning</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" disabled>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous Lesson
                      </Button>
                      <Button className="gradient-primary">
                        Next Lesson
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Take notes while you learn to reinforce your understanding.
                      </p>
                      <textarea
                        placeholder="Start taking notes..."
                        className="w-full min-h-[300px] p-4 rounded-lg border border-border bg-background resize-none"
                      />
                      <Button>Save Notes</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="resources" className="mt-0">
                    <div className="space-y-4">
                      <p className="text-muted-foreground mb-4">
                        Download course materials and resources
                      </p>
                      {[
                        { name: "Course slides.pdf", size: "2.5 MB" },
                        { name: "Code examples.zip", size: "1.8 MB" },
                        { name: "Cheat sheet.pdf", size: "850 KB" },
                      ].map((resource, index) => (
                        <Card key={index} className="hover-lift cursor-pointer">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{resource.name}</div>
                                <div className="text-sm text-muted-foreground">{resource.size}</div>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="discussion" className="mt-0 space-y-6">
                    {/* Start New Discussion */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Start a Discussion</h3>
                      <Textarea
                        placeholder="Ask a question or start a discussion..."
                        value={newDiscussion}
                        onChange={(e) => setNewDiscussion(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button 
                        onClick={() => {
                          if (!newDiscussion.trim()) return;
                          toast({
                            title: "Discussion Started",
                            description: "Your discussion has been posted successfully.",
                          });
                          setNewDiscussion("");
                        }} 
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Post Discussion
                      </Button>
                    </div>

                    {/* Existing Discussions */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold">Recent Discussions</h3>
                      {mockDiscussions.map((discussion) => (
                        <Card key={discussion.id}>
                          <CardContent className="p-4 space-y-4">
                            <div className="flex gap-3">
                              <Avatar>
                                <AvatarImage src={discussion.avatar} />
                                <AvatarFallback>{discussion.author[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{discussion.author}</span>
                                  <span className="text-xs text-muted-foreground">{discussion.time}</span>
                                </div>
                                <p className="text-sm">{discussion.message}</p>
                              </div>
                            </div>

                            {/* Replies */}
                            {discussion.replies.map((reply) => (
                              <div key={reply.id} className="ml-12 flex gap-3 pt-3 border-t">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={reply.avatar} />
                                  <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{reply.author}</span>
                                    <span className="text-xs text-muted-foreground">{reply.time}</span>
                                  </div>
                                  <p className="text-sm">{reply.message}</p>
                                </div>
                              </div>
                            ))}

                            {/* Reply Input */}
                            <div className="ml-12 flex gap-2 pt-3">
                              <Input
                                placeholder="Write a reply..."
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (!newReply.trim()) return;
                                  toast({
                                    title: "Reply Posted",
                                    description: "Your reply has been added successfully.",
                                  });
                                  setNewReply("");
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        {/* Sidebar - Course Content */}
        {sidebarOpen && (
          <div className="w-full md:w-96 border-l border-border flex flex-col bg-muted/20">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold mb-2">Course Content</h2>
              <div className="text-sm text-muted-foreground">
                {completedLessons.size} of {totalLessons} lessons completed
              </div>
              <Progress value={progress} className="mt-2" />
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {curriculum.map((chapter, chapterIndex) => (
                  <div key={chapterIndex} className="space-y-2">
                    <div className="font-semibold text-sm">{chapter.title}</div>
                    <div className="space-y-1">
                      {chapter.lessons.map((lesson, lessonIndex) => {
                        const lessonKey = `${chapterIndex}-${lessonIndex}`;
                        const isCompleted = completedLessons.has(lessonKey);
                        const isCurrent = chapterIndex === 0 && lessonIndex === 0;

                        return (
                          <button
                            key={lessonIndex}
                            className={`w-full text-left p-3 rounded-lg transition-smooth ${
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => {
                              setCurrentLesson(chapterIndex * 10 + lessonIndex);
                              setIsPlaying(false);
                              setCurrentTime(0);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 shrink-0 text-accent animate-scale-in" />
                              ) : (
                                <div className="h-4 w-4 shrink-0 rounded-full border-2" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {lesson.title}
                                </div>
                                <div className="text-xs opacity-70">{lesson.duration}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {lesson.type}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

const mockDiscussions = [
  {
    id: 1,
    author: "Sarah Mitchell",
    avatar: "/placeholder.svg",
    time: "2 hours ago",
    message: "What's the difference between let and const in JavaScript? I'm a bit confused about when to use each one.",
    replies: [
      {
        id: 1,
        author: "John Smith",
        avatar: "/placeholder.svg",
        time: "1 hour ago",
        message: "Great question! Use 'const' for values that won't be reassigned, and 'let' for values that will change. 'const' helps prevent bugs by making your intentions clear."
      },
      {
        id: 2,
        author: "Emily Chen",
        avatar: "/placeholder.svg",
        time: "45 minutes ago",
        message: "Also remember that 'const' doesn't make objects immutable - you can still modify object properties!"
      }
    ]
  },
  {
    id: 2,
    author: "Mike Rodriguez",
    avatar: "/placeholder.svg",
    time: "5 hours ago",
    message: "Having trouble with the setup on Windows. Getting an error when running npm install. Anyone else?",
    replies: [
      {
        id: 1,
        author: "Lisa Park",
        avatar: "/placeholder.svg",
        time: "4 hours ago",
        message: "Try running your terminal as administrator. That fixed it for me!"
      }
    ]
  }
];

const curriculum = [
  {
    title: "Introduction",
    lessons: [
      { title: "Welcome to the course", duration: "5:30", type: "video" },
      { title: "Course overview", duration: "8:45", type: "video" },
      { title: "Setting up your environment", duration: "12:20", type: "video" },
    ],
  },
  {
    title: "HTML Fundamentals",
    lessons: [
      { title: "HTML basics", duration: "10:30", type: "video" },
      { title: "Text formatting", duration: "8:45", type: "video" },
      { title: "Links and images", duration: "12:20", type: "video" },
      { title: "Practice exercise", duration: "15 min", type: "text" },
    ],
  },
  {
    title: "CSS Styling",
    lessons: [
      { title: "CSS introduction", duration: "8:15", type: "video" },
      { title: "Selectors and properties", duration: "14:30", type: "video" },
      { title: "Box model", duration: "18:45", type: "video" },
      { title: "Flexbox layout", duration: "22:10", type: "video" },
    ],
  },
];

export default CoursePlayer;
