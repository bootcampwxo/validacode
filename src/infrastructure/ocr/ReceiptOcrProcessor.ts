export interface OcrExtractionResult {
  text: string;
  amount?: number;
  date?: Date;
  cnpj?: string;
  merchantName?: string;
}

export class ReceiptOcrProcessor {
  public static async processReceipt(
    fileName: string,
    fileBuffer?: Buffer
  ): Promise<OcrExtractionResult> {
    // Simulação determinística inteligente de OCR para comprovantes fiscais / cupons
    const simulatedText = `CUPOM FISCAL ELETRONICO - SAT\nEMITENTE: RESTAURANTE E LANCHONETE EXEMPLO LTDA\nCNPJ: 12.345.678/0001-90\nDATA: ${new Date().toISOString().split('T')[0]}\nITEM 1 REFEICAO EXECUTIVA R$ 45,50\nTOTAL R$ 45,50`;

    return {
      text: simulatedText,
      amount: 45.5,
      date: new Date(),
      cnpj: '12345678000190',
      merchantName: 'RESTAURANTE E LANCHONETE EXEMPLO LTDA',
    };
  }
}
