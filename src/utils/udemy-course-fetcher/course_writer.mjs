import { LearnerLevel, PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises';

const prisma = new PrismaClient()

async function main() {
    const rawData = JSON.parse(
        await readFile(
            new URL('./course-files/udemy-courses.json', import.meta.url)
        )
    );

    // console.log(rawData[0])

    // const inputData = formatRawDataForInput(rawData);

    // console.log(inputData);

    // await prisma.udemyCourse.createMany({ data: inputData })

    const awsCourse = await prisma.udemyCourse.findUnique({
        where: {
            id: 1241098,
        },
    })

    console.log(awsCourse);
}

function formatRawDataForInput(rawData) {
    let inputData = [];

    for (let data of rawData) {
        const record = recordFromRawData(data)
        inputData.push(record)
    }

    return inputData;
}

function recordFromRawData(data) {
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        headline: data.headline,
        url: data.url,
        categories: data.categories,
        topics: data.topics.map(topic => topic.title),
        promo_video_url: data.promo_video_url,
        instructors: data.instructors,
        requirements: data.requirements.list,
        what_you_will_learn: data.what_you_will_learn.list,
        level: setLearnerLevel(data.level),
        images: data.images,
        locale: data.locale.locale,
        primary_category: data.primary_category.title,
        primary_subcategory: data.primary_subcategory.title,
        estimated_content_length: data.estimated_content_length,
        estimated_content_length_video: data.estimated_content_length_video,
        num_lectures: data.num_lectures,
        num_videos: data.num_videos,
        last_update_date: new Date(Date.parse(data.last_update_date))
    }
}

function setLearnerLevel(level) {
    if (level === null ||
        level == '' ||
        level == 'All Levels') return 'All_Levels';

    return level;
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })