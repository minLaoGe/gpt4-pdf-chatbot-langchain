import React, { ChangeEvent, FormEvent, useState } from "react";

const PdfUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type === "application/pdf") {
            setFile(file);
        } else {
            alert("Please upload a PDF file.");
            setFile(null);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file) {
            alert("No file selected!");
            return;
        }
        // TODO: Add file upload logic here
        // Create a FormData object
        const formData = new FormData();
        formData.append("file", file);

        // Send the file to the server
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert("上传成功")
            } else {
                alert("上传失败"+response.statusText)
            }
        } catch (error) {
            console.log('Error uploading file: ', error);
        }
        console.log("File Submitted: ", file.name);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Upload PDF:
                <input type="file" accept="application/pdf" name="file" onChange={handleFileChange} />
            </label>
            <br/>
            <button style={{backgroundColor: "reds"}} type="submit">Submit</button>
        </form>
    );
};

export default PdfUpload;
