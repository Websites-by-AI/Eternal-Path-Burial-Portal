export interface ExtractedGraveInfo {
  fullName: string;
  fatherName: string;
  birthDate: string;
  deathDate: string;
  inscription: string;
}

export async function extractGraveInfo(base64Image: string): Promise<ExtractedGraveInfo> {
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json() as ExtractedGraveInfo;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
}
