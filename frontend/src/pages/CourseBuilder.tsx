import { useState } from "react";
import { ArrowLeft, Save, Eye, Plus, GripVertical, Trash2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const CourseBuilder = () => {
  const [chapters, setChapters] = useState([
    {
      id: 1,
      title: "Introduction",
      lessons: [
        { id: 1, title: "Welcome to the course", type: "video", duration: "5:30" },
        { id: 2, title: "Course overview", type: "video", duration: "8:45" },
      ],
    },
  ]);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newLesson, setNewLesson] = useState({
    title: "",
    type: "video",
    duration: "",
    videoFile: null as File | null,
    resources: [] as File[],
  });

  const addChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({ title: "Error", description: "Chapter title is required", variant: "destructive" });
      return;
    }
    const newChapter = {
      id: Math.max(...chapters.map(c => c.id), 0) + 1,
      title: newChapterTitle,
      lessons: [],
    };
    setChapters([...chapters, newChapter]);
    setNewChapterTitle("");
    setShowChapterDialog(false);
    toast({ title: "Success", description: "Chapter added successfully" });
  };

  const deleteChapter = (chapterId: number) => {
    setChapters(chapters.filter(c => c.id !== chapterId));
    toast({ title: "Success", description: "Chapter deleted" });
  };

  const addLesson = () => {
    if (!newLesson.title.trim() || !selectedChapterId) {
      toast({ title: "Error", description: "Lesson title is required", variant: "destructive" });
      return;
    }
    setChapters(chapters.map(chapter => {
      if (chapter.id === selectedChapterId) {
        const newLessonObj = {
          id: Math.max(...chapter.lessons.map(l => l.id), 0) + 1,
          ...newLesson,
        };
        return { ...chapter, lessons: [...chapter.lessons, newLessonObj] };
      }
      return chapter;
    }));
    setNewLesson({ title: "", type: "video", duration: "", videoFile: null, resources: [] });
    setShowLessonDialog(false);
    toast({ title: "Success", description: "Lesson added successfully" });
  };

  const deleteLesson = (chapterId: number, lessonId: number) => {
    setChapters(chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return { ...chapter, lessons: chapter.lessons.filter(l => l.id !== lessonId) };
      }
      return chapter;
    }));
    toast({ title: "Success", description: "Lesson deleted" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/creator">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Create New Course</h1>
                <p className="text-muted-foreground">Build your course step by step</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Course Preview</DialogTitle>
                    <DialogDescription>Preview how your course will look to students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Course Title</h3>
                      <p className="text-muted-foreground mb-4">Course subtitle and description will appear here</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Course Content ({chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)} lessons)</h4>
                      <Accordion type="single" collapsible className="space-y-2">
                        {chapters.map((chapter) => (
                          <AccordionItem key={chapter.id} value={`preview-${chapter.id}`} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{chapter.title}</span>
                                <span className="text-sm text-muted-foreground mr-4">{chapter.lessons.length} lessons</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {chapter.lessons.map((lesson) => (
                                  <div key={lesson.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                                      <span className="text-sm">{lesson.title}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="gradient-primary" onClick={() => toast({ title: "Draft saved", description: "Your course has been saved" })}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete Web Development Bootcamp"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      placeholder="A brief description that appears below the title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="What will students learn in this course?"
                      rows={6}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Level *</Label>
                      <Select>
                        <SelectTrigger id="level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Course Thumbnail *</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 2MB (1280x720 recommended)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Course Trailer (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a promotional video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4 up to 500MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Curriculum */}
            <TabsContent value="curriculum" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Course Content</CardTitle>
                    <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Chapter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Chapter</DialogTitle>
                          <DialogDescription>Create a new chapter for your course</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="chapter-title">Chapter Title</Label>
                            <Input
                              id="chapter-title"
                              placeholder="e.g., Getting Started"
                              value={newChapterTitle}
                              onChange={(e) => setNewChapterTitle(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowChapterDialog(false)}>Cancel</Button>
                            <Button onClick={addChapter}>Add Chapter</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-4">
                    {chapters.map((chapter, chapterIndex) => (
                      <AccordionItem
                        key={chapter.id}
                        value={`chapter-${chapter.id}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 w-full">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 text-left">
                              <div className="font-semibold">{chapter.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {chapter.lessons.length} lessons
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapter(chapter.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Chapter Title</Label>
                            <Input defaultValue={chapter.title} />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Lessons</Label>
                              <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedChapterId(chapter.id)}>
                                    <Plus className="mr-2 h-3 w-3" />
                                    Add Lesson
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add New Lesson</DialogTitle>
                                    <DialogDescription>Add a lesson to {chapter.title}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-title">Lesson Title</Label>
                                      <Input
                                        id="lesson-title"
                                        placeholder="e.g., Introduction to the topic"
                                        value={newLesson.title}
                                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-type">Type</Label>
                                      <Select value={newLesson.type} onValueChange={(value) => setNewLesson({ ...newLesson, type: value })}>
                                        <SelectTrigger id="lesson-type">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="video">Video</SelectItem>
                                          <SelectItem value="quiz">Quiz</SelectItem>
                                          <SelectItem value="reading">Reading</SelectItem>
                                          <SelectItem value="assignment">Assignment</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-duration">Duration</Label>
                                      <Input
                                        id="lesson-duration"
                                        placeholder="e.g., 10:30"
                                        value={newLesson.duration}
                                        onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                                      />
                                    </div>

                                    {newLesson.type === "video" && (
                                      <div className="space-y-2">
                                        <Label htmlFor="lesson-video">Video File</Label>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-smooth">
                                          <input
                                            id="lesson-video"
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setNewLesson({ ...newLesson, videoFile: file });
                                                toast({ title: "Video selected", description: file.name });
                                              }
                                            }}
                                          />
                                          <label htmlFor="lesson-video" className="cursor-pointer">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground mb-1">
                                              {newLesson.videoFile ? newLesson.videoFile.name : "Click to upload video"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              MP4, MOV, AVI up to 1GB
                                            </p>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-resources">Resources (Optional)</Label>
                                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-smooth">
                                        <input
                                          id="lesson-resources"
                                          type="file"
                                          multiple
                                          accept=".pdf,.doc,.docx,.zip,.txt"
                                          className="hidden"
                                          onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                              setNewLesson({ ...newLesson, resources: [...newLesson.resources, ...files] });
                                              toast({ 
                                                title: "Resources added", 
                                                description: `${files.length} file(s) selected` 
                                              });
                                            }
                                          }}
                                        />
                                        <label htmlFor="lesson-resources" className="cursor-pointer">
                                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                          <p className="text-sm text-muted-foreground mb-1">
                                            Click to upload resources
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            PDF, DOC, ZIP up to 100MB each
                                          </p>
                                        </label>
                                      </div>
                                      {newLesson.resources.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          <p className="text-sm font-medium">Selected Resources:</p>
                                          {newLesson.resources.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                              <span className="truncate">{file.name}</span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                  setNewLesson({
                                                    ...newLesson,
                                                    resources: newLesson.resources.filter((_, i) => i !== idx)
                                                  });
                                                }}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => {
                                        setShowLessonDialog(false);
                                        setNewLesson({ title: "", type: "video", duration: "", videoFile: null, resources: [] });
                                      }}>Cancel</Button>
                                      <Button onClick={addLesson}>Add Lesson</Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {chapter.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-3 border rounded-lg"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline">{lesson.type}</Badge>
                                <span className="flex-1 text-sm">{lesson.title}</span>
                                <span className="text-sm text-muted-foreground">
                                  {lesson.duration}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => deleteLesson(chapter.id, lesson.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Course Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="49.99"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-sm text-muted-foreground">
                      Students will pay this amount to enroll in your course
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Price (Optional)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="39.99"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-sm text-muted-foreground">
                      Set a promotional price for limited time offers
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="font-semibold">Revenue Breakdown</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course Price</span>
                        <span>$49.99</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (10%)</span>
                        <span>-$5.00</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Your Earnings</span>
                        <span className="text-accent">$44.99</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Publish */}
            <TabsContent value="publish" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Publish?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-accent">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">Course Information</div>
                        <div className="text-sm text-muted-foreground">
                          Basic details and description added
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-accent">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">Course Content</div>
                        <div className="text-sm text-muted-foreground">
                          1 chapter with 2 lessons
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-accent">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">Pricing Set</div>
                        <div className="text-sm text-muted-foreground">
                          Course price configured
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm mb-4">
                      Once published, your course will be reviewed by our team within 24-48 hours. 
                      You'll be notified once it's live on the marketplace.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                      Save as Draft
                    </Button>
                    <Button className="flex-1 gradient-primary shadow-glow">
                      Publish Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CourseBuilder;
