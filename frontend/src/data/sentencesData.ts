import { EverydaySentenceEntry } from '../types/vocabulary';
import { Attribution } from '../types';

const defaultSentenceAttribution: Attribution = {
  source_name: 'Tatoeba Project Community',
  source_url: 'https://tatoeba.org',
  license_type: 'CC-BY 2.0 FR',
  attribution_text: 'Authentic conversational example sentences from the Tatoeba collaborative corpus licensed under Creative Commons Attribution 2.0 France.',
};

export const EVERYDAY_SENTENCES: EverydaySentenceEntry[] = [
  // =========================================================================
  // GREETINGS & INTRODUCTIONS
  // =========================================================================
  {
    id: 'sent-en-001',
    sentence_target: 'Good morning! It is a pleasure to meet you.',
    target_language: 'en',
    translations: {
      en: 'Good morning! It is a pleasure to meet you.',
      pt: 'Bom dia! É um prazer conhecê-lo(a).',
      es: '¡Buenos días! Es un placer conocerle.',
    },
    cefr_level: 'A1',
    topic: 'social',
    context_notes: 'Formal or polite business and social greeting.',
    linked_vocabulary: ['morning', 'pleasure', 'meet'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-001',
    sentence_target: 'Olá, como você se chama? O meu nome é Carlos.',
    target_language: 'pt',
    translations: {
      en: 'Hello, what is your name? My name is Carlos.',
      pt: 'Olá, como você se chama? O meu nome é Carlos.',
      es: 'Hola, ¿cómo te llamas? Mi nombre es Carlos.',
    },
    cefr_level: 'A1',
    topic: 'social',
    context_notes: 'Casual introductory question.',
    linked_vocabulary: ['chamar', 'nome'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-001',
    sentence_target: '¡Mucho gusto! ¿De qué parte de España eres?',
    target_language: 'es',
    translations: {
      en: 'Nice to meet you! Which part of Spain are you from?',
      pt: 'Muito prazer! De que parte de Espanha você é?',
      es: '¡Mucho gusto! ¿De qué parte de España eres?',
    },
    cefr_level: 'A1',
    topic: 'social',
    context_notes: 'Friendly conversation starter.',
    linked_vocabulary: ['gusto', 'parte'],
    attribution: defaultSentenceAttribution,
  },

  // =========================================================================
  // FOOD & RESTAURANTS
  // =========================================================================
  {
    id: 'sent-en-002',
    sentence_target: 'Could we please have a table for two near the window?',
    target_language: 'en',
    translations: {
      en: 'Could we please have a table for two near the window?',
      pt: 'Poderíamos ter uma mesa para dois perto da janela, por favor?',
      es: '¿Podríamos tener una mesa para dos cerca de la ventana, por favor?',
    },
    cefr_level: 'A2',
    topic: 'food_drink',
    context_notes: 'Polite restaurant reservation or arrival request.',
    linked_vocabulary: ['table', 'window'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-002',
    sentence_target: 'Pode trazer a conta e um café expresso, por favor?',
    target_language: 'pt',
    translations: {
      en: 'Could you bring the bill and an espresso, please?',
      pt: 'Pode trazer a conta e um café expresso, por favor?',
      es: '¿Puede traer la cuenta y un café solo, por favor?',
    },
    cefr_level: 'A1',
    topic: 'food_drink',
    context_notes: 'Ordering bill at a café or restaurant.',
    linked_vocabulary: ['conta', 'café'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-002',
    sentence_target: '¿Qué plato tradicional nos recomienda probar hoy?',
    target_language: 'es',
    translations: {
      en: 'What traditional dish do you recommend we try today?',
      pt: 'Que prato tradicional você recomenda que experimentemos hoje?',
      es: '¿Qué plato tradicional nos recomienda probar hoy?',
    },
    cefr_level: 'A2',
    topic: 'food_drink',
    context_notes: 'Asking for server recommendation.',
    linked_vocabulary: ['plato', 'recomendar'],
    attribution: defaultSentenceAttribution,
  },

  // =========================================================================
  // TRAVEL & TRANSPORTATION
  // =========================================================================
  {
    id: 'sent-en-003',
    sentence_target: 'Which platform does the express train to London depart from?',
    target_language: 'en',
    translations: {
      en: 'Which platform does the express train to London depart from?',
      pt: 'De que plataforma parte o comboio expresso para Londres?',
      es: '¿De qué andén sale el tren exprés hacia Londres?',
    },
    cefr_level: 'A2',
    topic: 'travel',
    context_notes: 'Navigating train stations.',
    linked_vocabulary: ['platform', 'train', 'depart'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-003',
    sentence_target: 'Onde posso comprar bilhetes para o metro e para o autocarro?',
    target_language: 'pt',
    translations: {
      en: 'Where can I purchase tickets for the subway and the bus?',
      pt: 'Onde posso comprar bilhetes para o metro e para o autocarro?',
      es: '¿Dónde puedo comprar billetes para el metro y el autobús?',
    },
    cefr_level: 'A1',
    topic: 'travel',
    context_notes: 'Public transit orientation.',
    linked_vocabulary: ['bilhete', 'metro'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-003',
    sentence_target: 'Disculpe, ¿está muy lejos el museo de arte del centro histórico?',
    target_language: 'es',
    translations: {
      en: 'Excuse me, is the art museum very far from the historic center?',
      pt: 'Com licença, o museu de arte fica muito longe do centro histórico?',
      es: 'Disculpe, ¿está muy lejos el museo de arte del centro histórico?',
    },
    cefr_level: 'A2',
    topic: 'travel',
    context_notes: 'Asking directions in a city.',
    linked_vocabulary: ['museo', 'lejos'],
    attribution: defaultSentenceAttribution,
  },

  // =========================================================================
  // SHOPPING & DAILY ROUTINES
  // =========================================================================
  {
    id: 'sent-en-004',
    sentence_target: 'Do you accept contactless card payments or only cash?',
    target_language: 'en',
    translations: {
      en: 'Do you accept contactless card payments or only cash?',
      pt: 'Aceitam pagamento por cartão contactless ou apenas dinheiro?',
      es: '¿Aceptan pagos con tarjeta sin contacto o solo efectivo?',
    },
    cefr_level: 'A2',
    topic: 'shopping',
    context_notes: 'Payment checkout question.',
    linked_vocabulary: ['payment', 'cash'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-004',
    sentence_target: 'Quanto custa esta camisola de lã azul-escura?',
    target_language: 'pt',
    translations: {
      en: 'How much does this dark-blue wool sweater cost?',
      pt: 'Quanto custa esta camisola de lã azul-escura?',
      es: '¿Cuánto cuesta este suéter de lana azul oscuro?',
    },
    cefr_level: 'A1',
    topic: 'shopping',
    context_notes: 'Inquiring clothing prices.',
    linked_vocabulary: ['quanto', 'custar'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-004',
    sentence_target: '¿Tienen este mismo modelo en una talla más grande?',
    target_language: 'es',
    translations: {
      en: 'Do you have this same model in a larger size?',
      pt: 'Têm este mesmo modelo num tamanho maior?',
      es: '¿Tienen este mismo modelo en una talla más grande?',
    },
    cefr_level: 'A2',
    topic: 'shopping',
    context_notes: 'Asking for sizes in retail stores.',
    linked_vocabulary: ['modelo', 'talla'],
    attribution: defaultSentenceAttribution,
  },

  // =========================================================================
  // HEALTH & EMERGENCIES
  // =========================================================================
  {
    id: 'sent-en-005',
    sentence_target: 'I need to see a doctor because I have had a severe fever since yesterday.',
    target_language: 'en',
    translations: {
      en: 'I need to see a doctor because I have had a severe fever since yesterday.',
      pt: 'Preciso consultar um médico porque estou com febre forte desde ontem.',
      es: 'Necesito ver a un médico porque tengo fiebre alta desde ayer.',
    },
    cefr_level: 'B1',
    topic: 'health',
    context_notes: 'Describing medical symptoms.',
    linked_vocabulary: ['doctor', 'fever'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-005',
    sentence_target: 'Onde fica a farmácia de serviço mais próxima daqui?',
    target_language: 'pt',
    translations: {
      en: 'Where is the nearest 24-hour on-duty pharmacy located from here?',
      pt: 'Onde fica a farmácia de serviço mais próxima daqui?',
      es: '¿Dónde está la farmacia de guardia más cercana a este lugar?',
    },
    cefr_level: 'A1',
    topic: 'health',
    context_notes: 'Urgent pharmaceutical assistance request.',
    linked_vocabulary: ['farmácia', 'próxima'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-005',
    sentence_target: 'Tengo dolor de cabeza y necesito comprar unas pastillas para el malestar.',
    target_language: 'es',
    translations: {
      en: 'I have a headache and need to buy some tablets for the discomfort.',
      pt: 'Estou com dor de cabeça e preciso comprar comprimidos para o mal-estar.',
      es: 'Tengo dolor de cabeza y necesito comprar unas pastillas para el malestar.',
    },
    cefr_level: 'A2',
    topic: 'health',
    context_notes: 'Buying over-the-counter medicine.',
    linked_vocabulary: ['dolor', 'pastillas'],
    attribution: defaultSentenceAttribution,
  },

  // =========================================================================
  // WORK & TECHNOLOGY
  // =========================================================================
  {
    id: 'sent-en-006',
    sentence_target: 'I will share the project slides and documentation via email after our call.',
    target_language: 'en',
    translations: {
      en: 'I will share the project slides and documentation via email after our call.',
      pt: 'Vou partilhar os diapositivos e a documentação do projeto por email após a nossa reunião.',
      es: 'Compartiré las diapositivas y la documentación del proyecto por correo tras la llamada.',
    },
    cefr_level: 'B1',
    topic: 'work',
    context_notes: 'Professional collaboration follow-up.',
    linked_vocabulary: ['project', 'documentation', 'email'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-pt-006',
    sentence_target: 'A conexão Wi-Fi caiu durante o envio do relatório final.',
    target_language: 'pt',
    translations: {
      en: 'The Wi-Fi connection dropped while sending the final report.',
      pt: 'A conexão Wi-Fi caiu durante o envio do relatório final.',
      es: 'La conexión wifi se cayó durante el envío del informe final.',
    },
    cefr_level: 'B1',
    topic: 'technology',
    context_notes: 'Describing technical hurdles in remote work.',
    linked_vocabulary: ['conexão', 'relatório'],
    attribution: defaultSentenceAttribution,
  },
  {
    id: 'sent-es-006',
    sentence_target: 'Podemos programar una videollamada para revisar juntos el código mañana por la mañana.',
    target_language: 'es',
    translations: {
      en: 'We can schedule a video call to review the code together tomorrow morning.',
      pt: 'Podemos agendar uma videochamada para revisar o código juntos amanhã de manhã.',
      es: 'Podemos programar una videollamada para revisar juntos el código mañana por la mañana.',
    },
    cefr_level: 'B1',
    topic: 'work',
    context_notes: 'Technical engineering scheduling.',
    linked_vocabulary: ['programar', 'código'],
    attribution: defaultSentenceAttribution,
  },
];
