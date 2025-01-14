import { createFetch, useClipboard } from '@vueuse/core'
import mitt from 'mitt'
import type { EmitterEvents } from '@shared/types/renderer/composable'
import { API_PORT } from '../../main/config'
import { useFolderStore } from '@/store/folders'
import { useSnippetStore } from '@/store/snippets'
import { ipc, track } from '@/electron'
import type { NotificationRequest } from '@shared/types/main'

export const useApi = createFetch({
  baseUrl: `http://localhost:${API_PORT}`
})

export const emitter = mitt<EmitterEvents>()

export const onAddNewSnippet = async () => {
  const folderStore = useFolderStore()
  const snippetStore = useSnippetStore()

  if (folderStore.selectedAlias !== undefined) return
  if (!folderStore.selectedId) return

  await snippetStore.addNewSnippet()
  await snippetStore.getSnippetsByFolderIds(folderStore.selectedIds!)
  await snippetStore.getSnippets()

  emitter.emit('snippet:focus-name', true)
  track('snippets/add-new')
}

export const onAddNewFragment = () => {
  const snippetStore = useSnippetStore()

  snippetStore.addNewFragmentToSnippetsById(snippetStore.selectedId!)
  snippetStore.fragment = snippetStore.fragmentCount!

  track('snippets/add-fragment')
}

export const onAddNewFolder = async () => {
  const folderStore = useFolderStore()
  const snippetStore = useSnippetStore()

  const folder = await folderStore.addNewFolder()
  snippetStore.selected = undefined

  emitter.emit('scroll-to:folder', folder.id)
  track('folders/add-new')
}

export const onCopySnippet = () => {
  const snippetStore = useSnippetStore()

  const { copy } = useClipboard({ source: snippetStore.currentContent })
  copy()

  ipc.invoke<any, NotificationRequest>('main:notification', {
    body: 'Snippet copied'
  })
  track('snippets/copy')
}

export const setScrollPosition = (el: HTMLElement, offset: number) => {
  const ps = el.querySelector('.ps')
  if (ps) ps.scrollTop = offset
}
