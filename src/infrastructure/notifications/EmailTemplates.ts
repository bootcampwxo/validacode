export class EmailTemplates {
  public static expenseSubmitted(data: {
    userName: string;
    expenseCode: string;
    expenseTitle: string;
    totalAmount: string;
  }): { subject: string; html: string; text: string } {
    const subject = `[Reembolso] Despesa ${data.expenseCode} submetida com sucesso`;
    const text = `Olá ${data.userName},\n\nSua despesa "${data.expenseTitle}" (${data.expenseCode}) no valor de ${data.totalAmount} foi submetida com sucesso e está em análise.\n\nAcompanhe o status pelo sistema.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0f62fe;">Despesa Submetida</h2>
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>Sua despesa <strong>${data.expenseTitle}</strong> (Código: <code>${data.expenseCode}</code>) foi enviada para o fluxo de aprovação.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Valor Total:</strong> ${data.totalAmount}</p>
          <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Em Análise</p>
        </div>
        <p>Você receberá novas atualizações conforme as etapas forem concluídas.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <small style="color: #666;">Sistema Corporativo de Gestão de Reembolsos</small>
      </div>
    `;
    return { subject, html, text };
  }

  public static approvalRequired(data: {
    approverName: string;
    requesterName: string;
    expenseCode: string;
    expenseTitle: string;
    totalAmount: string;
    approvalUrl: string;
  }): { subject: string; html: string; text: string } {
    const subject = `[Ação Necessária] Aprovação pendente para a despesa ${data.expenseCode}`;
    const text = `Olá ${data.approverName},\n\nVocê possui uma solicitação de aprovação pendente para a despesa "${data.expenseTitle}" (${data.expenseCode}) do colaborador ${data.requesterName} no valor de ${data.totalAmount}.\n\nAcesse o sistema para avaliar: ${data.approvalUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0f62fe;">Aprovação de Reembolso Pendente</h2>
        <p>Olá <strong>${data.approverName}</strong>,</p>
        <p>Uma nova despesa requer a sua análise e aprovação:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Solicitante:</strong> ${data.requesterName}</p>
          <p style="margin: 5px 0 0 0;"><strong>Código:</strong> <code>${data.expenseCode}</code></p>
          <p style="margin: 5px 0 0 0;"><strong>Título:</strong> ${data.expenseTitle}</p>
          <p style="margin: 5px 0 0 0;"><strong>Valor:</strong> ${data.totalAmount}</p>
        </div>
        <a href="${data.approvalUrl}" style="display: inline-block; background-color: #0f62fe; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Revisar Despesa</a>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <small style="color: #666;">Sistema Corporativo de Gestão de Reembolsos</small>
      </div>
    `;
    return { subject, html, text };
  }

  public static expenseApproved(data: {
    userName: string;
    expenseCode: string;
    expenseTitle: string;
    totalAmount: string;
  }): { subject: string; html: string; text: string } {
    const subject = `[Reembolso Aprovado] Despesa ${data.expenseCode} aprovada com sucesso`;
    const text = `Olá ${data.userName},\n\nSua despesa "${data.expenseTitle}" (${data.expenseCode}) no valor de ${data.totalAmount} foi aprovada em todas as instâncias e encaminhada para o lote de pagamento.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #198038;">Reembolso Aprovado</h2>
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>Sua despesa <strong>${data.expenseTitle}</strong> (Código: <code>${data.expenseCode}</code>) foi integralmente aprovada.</p>
        <div style="background-color: #defbe6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #198038;">
          <p style="margin: 0;"><strong>Valor Aprovado:</strong> ${data.totalAmount}</p>
          <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Aprovado para Pagamento</p>
        </div>
        <p>O crédito será realizado na sua conta bancária cadastrada conforme o calendário financeiro.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <small style="color: #666;">Sistema Corporativo de Gestão de Reembolsos</small>
      </div>
    `;
    return { subject, html, text };
  }

  public static expensePaid(data: {
    userName: string;
    expenseCode: string;
    expenseTitle: string;
    totalAmount: string;
    transactionReference?: string;
  }): { subject: string; html: string; text: string } {
    const subject = `[Pagamento Realizado] Reembolso da despesa ${data.expenseCode} efetuado`;
    const text = `Olá ${data.userName},\n\nO pagamento no valor de ${data.totalAmount} referente à despesa "${data.expenseTitle}" (${data.expenseCode}) foi efetuado.\nComprovante/Ref: ${data.transactionReference || 'N/A'}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #198038;">Pagamento Efetuado!</h2>
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>O reembolso da despesa <strong>${data.expenseTitle}</strong> (Código: <code>${data.expenseCode}</code>) foi pago com sucesso.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Valor Pago:</strong> ${data.totalAmount}</p>
          <p style="margin: 5px 0 0 0;"><strong>Identificador da Transação:</strong> <code>${data.transactionReference || 'Processamento Concluído'}</code></p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <small style="color: #666;">Sistema Corporativo de Gestão de Reembolsos</small>
      </div>
    `;
    return { subject, html, text };
  }
}
