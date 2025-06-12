import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ModulePopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onModuleCreated?: () => void;
}

const ModulePopup: React.FC<ModulePopupProps> = ({ open, onOpenChange, onModuleCreated }) => {
    const [name, setName] = useState("");
    const [difficulty, setDifficulty] = useState("mittel");
    const [deadline, setDeadline] = useState("");
    const [ects, setEcts] = useState("");
    const [studyTime, setStudyTime] = useState("");

    const handleCreateModule = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return alert("Bitte erneut einloggen.");

        const user = JSON.parse(storedUser);

        const newModule = {
            name,
            difficulty,
            deadline,
            ects: Number(ects),
            studyTime: Number(studyTime),
            user: { id: user.id }
        };

        fetch("http://localhost:8080/api/modules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newModule)
        })
            .then((res) => {
                if (!res.ok) throw new Error("Fehler beim Erstellen des Moduls.");
                return res.json();
            })
            .then(() => {
                if (onModuleCreated) onModuleCreated();
                onOpenChange(false);
            })
            .catch((err) => alert(err.message));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white w-full max-w-md p-0 rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Add New Module </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Statistik 2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <Select onValueChange={setDifficulty} value={difficulty}>
                            <SelectTrigger className="w-full border-gray-300 bg-white">
                                <SelectValue placeholder="Bitte auswählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="leicht">Easy</SelectItem>
                                <SelectItem value="mittel">Middle</SelectItem>
                                <SelectItem value="schwer">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline / exam day</label>
                        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ECTS</label>
                            <Input type="number" value={ects} onChange={(e) => setEcts(e.target.value)} placeholder="e.g. 6" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Learning time so far (in hours)</label>
                            <Input type="number" value={studyTime} onChange={(e) => setStudyTime(e.target.value)} placeholder="e.g. 8" />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button className="bg-[#002366] hover:bg-[#001a4d] text-white" onClick={handleCreateModule}>
                            Create Module
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModulePopup;
