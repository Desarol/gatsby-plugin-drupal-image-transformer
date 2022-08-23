import { GatsbyNode } from 'gatsby'
import { generateImageSource } from 'gatsby-plugin-image/graphql-utils'
import { getGatsbyImageFieldConfig } from 'gatsby-plugin-image/graphql-utils'


export const pluginOptionsSchema: GatsbyNode['pluginOptionsSchema'] = ({ Joi }) => {
  return Joi.object({
    // hello: Joi.string().required(),
  })
}

const resolveGatsbyImageData = async (mediaImage: any, options: any, context: any) => {
  // The `image` argument is the node to which you are attaching the resolver,
  // so the values will depend on your data type.
  const relatedFileNode = await (
    context
      .nodeModel
      .findOne({
        query: {
          filter: {
            filename: { eq: mediaImage?.name }
          },
        },
        type: 'file__file'
      })
  )

  const filename = relatedFileNode?.uri?.value
  const sourceMetadata = {
    width: mediaImage?.field_media_image?.width,
    height: mediaImage?.field_media_image?.height,
    format: relatedFileNode?.filemime?.split('/')?.[1],
  }

  const imageDataArgs = {
    ...options,
    // Passing the plugin name allows for better error messages
    pluginName: 'gatsby-source-drupal',
    sourceMetadata,
    filename,
    generateImageSource,
    options,
  }

  // Generating placeholders is optional, but recommended
  if (options.placeholder === 'blurred') {
    const sWidth = sourceMetadata.width
    const sHeight = sourceMetadata.height

    let scaleRatio
    if (sWidth < sHeight) {
      scaleRatio = 20 / sHeight
    } else {
      scaleRatio = 20 / sWidth
    }

    // This function returns the URL for a 20px-wide image, to use as a blurred placeholder
    // You need to download the image and convert it to a base64-encoded data URI
    const { src: thumbnailUrl } = generateImageSource(filename, sWidth * scaleRatio, sHeight * scaleRatio, 'png')

    // This would be your own function to download and generate a low-resolution placeholder
    imageDataArgs.placeholderURL = `data:image/png;base64,${await getBase64Image(thumbnailUrl)}`
  }

  // You could also calculate dominant color, and pass that as `backgroundColor`
  // gatsby-plugin-sharp includes helpers that you can use to generate a tracedSVG or calculate
  // the dominant color of a local file, if you don't want to handle it in your plugin
  return generateImageData(imageDataArgs)
}

export const createResolvers: GatsbyNode['createResolvers'] = ({ createResolvers: createResolvers_ }) => {
  createResolvers_({
    media__image: {
      gatsbyImageData: {
        ...getGatsbyImageFieldConfig(resolveGatsbyImageData),
      },
    },
  })
}