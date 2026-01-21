import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Layers,
  Link2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/overlays/")({
  component: ProjectListPage,
});

function ProjectListPage() {
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);
  const deleteProject = useMutation(api.projects.remove);
  const navigate = useNavigate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const projectId = await createProject({ name: newProjectName.trim() });
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      navigate({ to: "/overlays/$projectId", params: { projectId } });
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject({ id: projectId as never });
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleCopyOBSLink = (projectId: string) => {
    const liveViewUrl = `${window.location.origin}/overlays/${projectId}/view`;
    navigator.clipboard.writeText(liveViewUrl);
    toast.success("OBS Browser Source URL copied!");
  };

  const handleOpenPreview = (projectId: string) => {
    const liveViewUrl = `${window.location.origin}/overlays/${projectId}/view`;
    window.open(liveViewUrl, "_blank");
  };

  if (projects === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-gray-900">Overlays</h1>
            <p className="mt-1 text-gray-500">
              Create and manage your stream overlays
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
          >
            <Plus className="h-5 w-5" />
            New Overlay
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 border-dashed py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <Layers className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 text-lg">
              No overlays yet
            </h3>
            <p className="mb-6 max-w-sm text-center text-gray-500 text-sm">
              Create your first overlay to start designing stream graphics with
              our Figma-like canvas editor.
            </p>
            <Button
              className="gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create your first overlay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                key={project._id}
                params={{ projectId: project._id }}
                to="/overlays/$projectId"
              >
                <div className="aspect-video bg-linear-to-br from-gray-100 to-gray-50">
                  <div className="flex h-full items-center justify-center">
                    <Layers className="h-12 w-12 text-gray-300" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-gray-500 text-sm">
                    Updated{" "}
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyOBSLink(project._id);
                      }}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy OBS URL
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenPreview(project._id);
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteProject(project._id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new overlay</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProjectName.trim()) {
                  handleCreateProject();
                }
              }}
              placeholder="Overlay name"
              value={newProjectName}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCreateDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!newProjectName.trim() || isCreating}
              onClick={handleCreateProject}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
