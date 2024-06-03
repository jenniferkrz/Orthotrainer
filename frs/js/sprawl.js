/*                           It is 202X.
    The sky is is the color of television, tuned to a dead channel
	    and below, the cold glimmer of neon lights the

    ::::::::  :::::::::  :::::::::      :::     :::       ::: :::
   :+:    :+: :+:    :+: :+:    :+:   :+: :+:   :+:       :+: :+:        
   +:+        +:+    +:+ +:+    +:+  +:+   +:+  +:+       +:+ +:+        
   +#++:++#++ +#++:++#+  +#++:++#:  +#++:++#++: +#+  +:+  +#+ +#+        
          +#+ +#+        +#+    +#+ +#+     +#+ +#+ +#+#+ +#+ +#+        
   #+#    #+# #+#        #+#    #+# #+#     #+#  #+#+# #+#+#  #+#        
    ########  ###        ###    ### ###     ###   ###   ###   ########## .js

			   of DOM elements.
   A textual representation of markup, lines of light ranged in the
      nonspace of the mind, clusters and constellations of data.
 
      [[https://opensource.org/licenses/0BSD][0BSD-License]]
*/

const sprawl = m => {
    if (m.length > 1) {
	const [first, ...rest] = m;
	[args, ...children] = (rest[0] && rest[0][0] == '@') ? rest : [null].concat(rest);

	const el = document.createElement(first);
	args && args.slice(1).forEach(([k,v]) => el.setAttribute(k, v));
	console.log(JSON.stringify(m));
	children.forEach(c => el.appendChild(sprawl(c)));
	return el;
    } else {
	// text-node
	return document.createTextNode(m);
    }
}
