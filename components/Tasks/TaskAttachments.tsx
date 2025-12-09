'use client';

import { useState } from 'react';
import { Task, Attachment, VisibilityLevel } from '@/lib/types';
import { Paperclip, Link as LinkIcon, X, Lock, Users, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface TaskAttachmentsProps {
    task: Partial<Task>;
    onChange: (updates: Partial<Task>) => void;
}

export default function TaskAttachments({ task, onChange }: TaskAttachmentsProps) {
    const { user } = useAuth();
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const [visibleToInput, setVisibleToInput] = useState('');

    const attachments = task.attachments || [];
    const visibility = task.visibility || 'all';
    const visibleTo = task.visibleTo || [];

    const addLink = () => {
        if (!linkUrl || !linkName) return;

        const newAttachment: Attachment = {
            id: Date.now().toString(),
            name: linkName,
            type: 'link',
            url: linkUrl,
            addedBy: user?.email || 'unknown',
            addedAt: new Date().toISOString(),
        };

        onChange({
            attachments: [...attachments, newAttachment]
        });

        setLinkUrl('');
        setLinkName('');
        setShowLinkInput(false);
    };

    const removeAttachment = (id: string) => {
        onChange({
            attachments: attachments.filter(a => a.id !== id)
        });
    };

    const updateVisibility = (level: VisibilityLevel) => {
        onChange({
            visibility: level,
            visibleTo: level === 'all' ? [] : visibleTo
        });
    };

    const addVisibleTo = () => {
        if (!visibleToInput.trim()) return;

        const newVisibleTo = Array.from(new Set([...visibleTo, visibleToInput.trim()]));
        onChange({ visibleTo: newVisibleTo });
        setVisibleToInput('');
    };

    const removeVisibleTo = (item: string) => {
        onChange({
            visibleTo: visibleTo.filter(v => v !== item)
        });
    };

    return (
        <div className="space-y-6">
            {/* Attachments Section */}
            <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="text-xs px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors flex items-center gap-1"
                    >
                        <LinkIcon className="w-3 h-3" />
                        Add Link
                    </button>
                </div>

                {showLinkInput && (
                    <div className="mb-3 p-3 bg-white/5 rounded-lg space-y-2">
                        <input
                            type="text"
                            placeholder="Display Name (e.g., Informe DGCine Noviembre)"
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        />
                        <input
                            type="url"
                            placeholder="URL (e.g., https://drive.google.com/...)"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={addLink}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                    setLinkName('');
                                }}
                                className="px-3 py-1 bg-white/5 text-foreground rounded text-sm hover:bg-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {attachments.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3 text-center">
                        No attachments. Add links to Google Drive, reports, or other documents.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{attachment.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{attachment.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30"
                                    >
                                        Open
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(attachment.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Permissions Section */}
            <div className="border-t border-white/10 pt-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4" />
                    Visibility & Permissions
                </label>

                <div className="space-y-3">
                    {/* Visibility Level */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Who can see this task?</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => updateVisibility('all')}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${visibility === 'all'
                                    ? 'bg-primary/20 border-primary/30 text-primary'
                                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-medium">Everyone</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => updateVisibility('department')}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${visibility === 'department'
                                    ? 'bg-primary/20 border-primary/30 text-primary'
                                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-medium">Department</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => updateVisibility('individual')}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${visibility === 'individual'
                                    ? 'bg-primary/20 border-primary/30 text-primary'
                                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                <span className="text-xs font-medium">Specific</span>
                            </button>
                        </div>
                    </div>

                    {/* Specific Visibility */}
                    {(visibility === 'department' || visibility === 'individual') && (
                        <div className="p-3 bg-white/5 rounded-lg space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {visibility === 'department'
                                    ? 'Enter department names or leave empty for task department'
                                    : 'Enter email addresses of people who can see this'}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={visibility === 'department' ? 'e.g., Guión' : 'e.g., user@example.com'}
                                    value={visibleToInput}
                                    onChange={(e) => setVisibleToInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVisibleTo())}
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                />
                                <button
                                    type="button"
                                    onClick={addVisibleTo}
                                    className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                                >
                                    Add
                                </button>
                            </div>
                            {visibleTo.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {visibleTo.map((item) => (
                                        <span
                                            key={item}
                                            className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                                        >
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeVisibleTo(item)}
                                                className="hover:text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
