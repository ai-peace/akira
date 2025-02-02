import { faker } from '@faker-js/faker'
import { LlmStatus, Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma-service.util'

type DocumentCreateInput = Prisma.DocumentCreateInput
type OptionalDocumentCreateInput = Partial<Omit<DocumentCreateInput, 'project' | 'agent'>> & {
  projectId?: number
  agentId?: number
}

const documentBaseInput = async (
  projectId?: number,
  agentId?: number,
): Promise<DocumentCreateInput> => {
  const project = projectId

  return {
    uniqueKey: faker.string.uuid(),
    title: faker.lorem.sentence(),
    mdxContent: mdxContent(),
    llmStatus: LlmStatus.IDLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

const createDocument = async (input: DocumentCreateInput) => {
  return prisma.document.create({
    data: input,
  })
}

const documentFactory = async (optionalInput?: OptionalDocumentCreateInput) => {
  const { projectId, agentId, ...rest } = optionalInput || {}
  const documentInput = await documentBaseInput(projectId, agentId)

  return createDocument({
    ...documentInput,
    ...rest,
  })
}

const documentFactoryList = async (count: number, optionalInput?: OptionalDocumentCreateInput) => {
  const documents: Awaited<ReturnType<typeof documentFactory>>[] = []

  for (let i = 0; i < count; i++) {
    documents.push(await documentFactory(optionalInput))
  }

  return documents
}

export const DocumentFactory = {
  create: documentFactory,
  createMany: documentFactoryList,
}

const mdxContent = () => {
  return `
# ${faker.lorem.sentence()}

${faker.lorem.paragraph()}

## ${faker.lorem.sentence()}

- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

### ${faker.lorem.sentence()}

1. ${faker.lorem.sentence()}
2. ${faker.lorem.sentence()}
3. ${faker.lorem.sentence()}

> ${faker.lorem.sentence()}

|\`\`\`javascript
console.log('${faker.lorem.words(3)}');
|\`\`\`

**${faker.lorem.word()}**: ${faker.lorem.sentence()}

${faker.lorem.paragraph()}

![${faker.lorem.word()}](https://via.placeholder.com/150)

${faker.lorem.paragraphs(5)}
`
}
