enum CssSection {
    SELECTOR,
    PROPERTY
}

enum SelectorState {
    NEW_ELEMENT,
    FIND_ELEMENT_END,
    PSEUDO_ELEMENT,
    PROPERTY_VALUE
}

interface ParsedItem {
    keys: Array<string>,
    properties: {[key: string]: string}
}

export class Css2JssConverter {
    private text: string

    constructor(text:string) {
        this.text = text
    }

    parse() {
        const parsedObj = {}
        let section = CssSection.SELECTOR
        let pos = 0
        let parsedItem: ParsedItem

        //remove all comments before parsing
        const text = this.text.replace(/\/\*.*\*\//gm, '')

        while (pos < text.length) {
            switch (<CssSection>section) {
                case (CssSection.SELECTOR):
                    let endOfSelector = text.indexOf('{', pos)
                    if (endOfSelector === -1) {
                        pos = text.length
                        break
                    }

                    let selector = text.substring(pos, endOfSelector)
                    parsedItem = {keys: this.parseSelector(selector), properties: {}}

                    pos = endOfSelector + 1
                    section = CssSection.PROPERTY
                    break
                case (CssSection.PROPERTY):
                    let endOfProperties = text.indexOf('}', pos)
                    let properties = text.substring(pos, endOfProperties).split(';')
                    properties.forEach(propertyTxt => {
                        let keyValue = propertyTxt.split(':')
                        if (keyValue.length == 2) {
                            const key = removeDashes(keyValue[0].trim())
                            parsedItem.properties[key] = keyValue[1].trim()
                        }
                    })

                    this.addParsedItemToObj(parsedItem, parsedObj)

                    pos = endOfProperties + 1
                    section = CssSection.SELECTOR
                    break
                default:
                    throw new Error('Invalid css section!')
            }
        }

        return JSON.stringify(parsedObj, null, 4)
    }

    private addParsedItemToObj(parsedItem: ParsedItem, parsedObj: any) {
        let node = parsedObj
        parsedItem.keys.forEach(key => {
            if (!node[key]){
                node[key] = {}
            }
            node = node[key]
        })

        for (let key in parsedItem.properties) {
            node[key] = parsedItem.properties[key]
        }
    }

    private parseSelector(selector: string) {
        let tokens = selector.trim().split('')
        let keys = []
        let key
        let state = SelectorState.NEW_ELEMENT
        tokens.forEach((token, i) => {
            switch (<SelectorState>state) {
                case SelectorState.NEW_ELEMENT:
                    switch (token) {
                    case '#':
                        key = key ? key+'#' : '@global #'
                        state = SelectorState.FIND_ELEMENT_END
                        break
                    case '.':
                        if (i === 0) {
                            key = ''
                        } else {
                            key = key ? key+'$' : '&$'
                        }
                        state = SelectorState.FIND_ELEMENT_END
                        break
                    case ' ':
                        if (key) {
                            keys.push(key)
                            key = ''
                        }
                        break

                    case '+':
                    case '>':
                        key = key + token
                        break

                    default: 
                        key = '@global ' + token
                        state = SelectorState.FIND_ELEMENT_END
                        break
                    }
                break
                case SelectorState.FIND_ELEMENT_END:
                    switch (token) {
                        case ' ':
                            keys.push(key)
                            state = SelectorState.NEW_ELEMENT
                            key = ''
                            break
                        case ':':
                            keys.push(key)
                            state = SelectorState.PSEUDO_ELEMENT
                            key = '&:'
                            break
                        case '+':
                            keys.push(key)
                            state = SelectorState.NEW_ELEMENT
                            key = ''
                            break
                        case '>':
                            keys.push(key)
                            state = SelectorState.NEW_ELEMENT
                            key = ''
                            break
                        case '[':
                            keys.push(key)
                            state = SelectorState.PROPERTY_VALUE
                            key = '&['
                            break
                        default:
                            key += token
                        break
                    }
                break
                case SelectorState.PSEUDO_ELEMENT:
                    key += token
                    state = SelectorState.FIND_ELEMENT_END
                break
                case SelectorState.PROPERTY_VALUE:
                    key += token
                    if (token === ']') {
                        state = SelectorState.NEW_ELEMENT
                    }
                break
            }
        })
        keys.push(key)
        return keys
    }
}

function removeDashes(text) {
    //remove - and replace for uppercase
    return text.replace(/\-\w+/g, (match: string) => {
        return (match.charAt(1).toUpperCase() + match.slice(2))
    })
}