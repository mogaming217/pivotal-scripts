import axios from 'axios'
import chalk from 'chalk'
import { parse } from 'csv-parse'
import { readFileSync } from 'fs'
import prompts from 'prompts'

const log = console.log
const CSV_FILE_PATH = './pivotalStories.csv'

type Data = {
  name: string
  storyType: 'feature' | 'bug' | 'chore' | 'release'
  description?: string
}

// 1行から複数個作成してもOK
const csvRowToData = (row: any): Data[] => {
  const name = `【${row.app}】${row.usecase}`
  const textList: string[] = []
  if (row.path) textList.push(`■path\n${row.path}`)
  if (row.memo) textList.push(`■memo\n${row.memo}`)
  if (row.figma) textList.push(`■figma\n${row.figma}`)
  return [{ name, storyType: 'feature', description: textList.join('\n\n').replace(/\\r\\n/, '\n') }]
}

const main = async () => {
  const projectID = process.env.PROJECT_ID
  if (!projectID) {
    log(chalk.red('You must pass PROJECT_ID in environment variables'))
    log(`example:`, chalk.yellow('$ PROJECT_ID=xxxx npx ts-node bulkCreateStories.ts'))
    return
  }

  const input = await prompts({
    type: 'password',
    name: 'value',
    message: 'Your pivotal tracker account token (get in https://www.pivotaltracker.com/profile)',
  })

  const token = input.value as string
  if (!token) {
    log(chalk.red('no token passed'))
    return
  }

  const data = await getDataFromCSV()
  for (const story of data) {
    await axios.post(
      `https://www.pivotaltracker.com/services/v5/projects/${projectID}/stories`,
      {
        name: story.name,
        story_type: story.storyType,
        description: story.description,
      },
      {
        headers: {
          'X-TrackerToken': token,
        },
      }
    )
    console.log(`processed: ${story.name}`)
  }
}

const getDataFromCSV = (): Promise<Data[]> => {
  const csv = readFileSync(CSV_FILE_PATH, 'utf8')
  const parser = parse(csv, { columns: true })
  const data: Data[] = []

  return new Promise<Data[]>(resolve => {
    parser.on('readable', () => {
      let record
      while ((record = parser.read()) !== null) {
        data.push(...csvRowToData(record))
      }
    })

    // Catch any error
    parser.on('error', err => {
      console.error(err.message)
    })

    // Test that the parsed records matched the expected records
    parser.on('end', () => {
      resolve(data)
    })
  })
}

main()
